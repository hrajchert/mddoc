import { RefQuery, Directive } from "./MetadataManager";
import { walkDir } from "./utils/ts-task-fs-utils/walkDir";
import { Task } from "@ts-task/task";
import { readFile } from "./utils/ts-task-fs/readFile";
import { tap } from "./utils/tap";
import { VerboseSettings } from "..";

var markdown = require("markdown").markdown,
    EventPromise = require("./EventPromise"),
    crypto = require("crypto");

const { yellow, grey } = require("colors");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);

/**
 * Class that reads a markdown file and gets references to the code out of it
 */
export class MarkdownFileReader {
    /**
     * Indicate if the parser should print verbose logging
     */
    verbose = true;

    filehash?: string;

    jsonml?: any[];

    /**
     * @param plainFileName     The logical file path
     * @param completeFileName  The real file path from the working directory
     */
    constructor (public plainFileName: string, public completeFileName: string) {

    }

    setVerbose (v: boolean) {
        this.verbose = v;
    }

    /**
     * Read and parse the markdown file into a JsonML object.
     * @return  {Promise.<MarkdownFileReader>}  A Promise of self that will be resolved
     *                                          once the file is parsed
     */
    parse () {
        var self = this;
        return readFile(self.completeFileName, "utf8").map(function(md) {
            if (self.verbose) {
                console.log(yellow("parsing ") + grey(self.completeFileName));
            }
            // Get an md5 of the md file
            self.filehash = crypto.createHash("md5").update(md).digest("hex");

            // Parse the markdown into JsonML
            self.jsonml = markdown.parse(md, "miMkd");

            // Indicate the job is done
            return self;
        });
    }

    /**
     * @summary Actually do get the references from the parsed markdown file
     *
     * @desc    Traverse the JsonML and extract all code references. Parse needs
     *          to be called before this
     *
     * @return  {Array.<Reference>}   The references
     * @private
     */
    private _doGetReferences (jsonml?: any[]) {
        if (typeof jsonml === 'undefined') throw 'jsonml shouldnt be undefined';

        var references: MarkdownReference[] = [];
        // For each markdown block
        for (var blockNumber=1; blockNumber< jsonml.length ; blockNumber++) {
            var mlBlock = jsonml[blockNumber];
            // If its not an actual JsonML block, move on
            if (!Array.isArray(mlBlock)) {
                continue;
            }
            // See if this block is a code reference block
            if ( mlBlock[0] === "code_reference" ) {
                // Get the attributes from the jsonml

                var attr = JSON.parse("{"+mlBlock[1]+"}");

                // Each attribute must have a src and a ref
                if (typeof attr.src === "undefined" || typeof attr.ref === "undefined") {
                    throw new Error("Invalid reference\n" + mlBlock[1]) ;
                }

                var referingBlocks = attr.hasOwnProperty("referingBlocks")?attr.referingBlocks:1;
                var referencingMl = null;
                if ( blockNumber > referingBlocks ) {
                    referencingMl = [];
                    for (var i = blockNumber - referingBlocks; i < blockNumber ; i++) {
                        referencingMl.push(jsonml[i]);
                    }
                }

                // Interpret the reference
                var ref = {
                    "name" : attr.name?attr.name:false,
                    "src" : attr.src,
                    "ref" : attr.ref,
                    "lineNumber" : mlBlock[2].lineNumber,
                    // Create a hash from the reference itself
                    "refhash" : crypto.createHash("md5").update(mlBlock[1]).digest("hex"),
                    // TODO: Check this out later
                    "status" : "pending",
                    "jsonml" : mlBlock,
                    "refMl": referencingMl,
                    "directive" : mlBlock[2].type
                };

                // Make sure the jsonml doesnt get saved into disk
                Object.defineProperty(ref,"jsonml",{enumerable:false});
                // Neither there referencing one
                Object.defineProperty(ref,"refMl",{enumerable:false});

                // TODO: eventually this could be removed, i think
                // I have to remove the third argument as it is the extra data (that cant be rendered).
                // I Can't remember why I said this code could be removed.
                mlBlock.splice(2);
                // Add the reference to the reference list
                references.push(ref);
            } else {
                // This block its not a reference, but it might have inner references
                // NOT FOR NOW.
            }
        }
        return references;
    };


    private references?: MarkdownReference[];

    /**
     * Get any code references from the parsed markdown file
     *
     * This method serves as a cache method only, the real reference extraction
     * is done with {@link _doGetReferences}
     *
     */
    getReferences () {
        if (typeof this.references === "undefined") {
            this.references = this._doGetReferences(this.jsonml);

        }
        return this.references;
    };

}






/**
 * An object that represents a reference
 */

interface MarkdownReference {
    // Optional name of the reference, false if its not named
    name: string | false;
    // The path to the referenced file (normally a code file)
    src: string;

    // What to look for in the referenced file
    ref: RefQuery;

    // The line number in the markdown file where this reference start
    lineNumber: number; // or string?

    // A hash of the reference, serves to identify it, going to change soon
    refhash: string;

    status: string; // TODO: Check out later

    // It gives semantics to the reference, why are we refering to this code,
    // is this a warning? a todo? do we want to include it? etc... It will
    // tell the rest of the library and tools how to render the ref, or how
    // to treat it (in a tool).
    directive: Directive;
}


export type MarkdownReaderSettings = {
    inputDir: string;
    inputExclude?: string;
} & VerboseSettings;

/**
 * @summary Class in charge of reading the markdown files, and getting the references out of them.
 *
 * @param   {Settings}    settings    The mddoc configuration for this project
 * @constructor
 */
export class MarkdownReader {
    eventPromise: any;
    constructor () {
        this.eventPromise = EventPromise.create();
    }

    on (...args: any[]) {
        this.eventPromise.on(...args);
    }

    trigger (...args: any[]) {
        this.eventPromise.trigger(...args);
    }

    /**
     * Walks the documentation folder, also known as input dir, and parses the markdown files
     * in it
     */
    parse (settings: MarkdownReaderSettings) {
        var self = this;
        // Walk the input dir recursively, get a list of all files
        return walkDir(settings.inputDir, {exclude: settings.inputExclude})
            .chain(files => {

                var mdre = /(.*)\.md$/;

                // Precalculate the lenght of the name of the input dir
                var dirNameLength = settings.inputDir.length;

                // // Method to add context to an error in the parsing of a md file
                // var handleMdError = function(err) {
                //     err.reader = this;
                //     return when.reject(err);
                // };

                // TODO: If there are too many input files this will try to read them all, which can cause
                // a too many open files error. I have to divide the work in chunks
                // For each input file
                const tasks = files
                    // Check that the file is a markdown file
                    .map(file => ({file, match: file.substr(dirNameLength+1).match(mdre)}))
                    .filter(({match}) => match)
                    .map(({file, match}) => {
                        if (match === null) throw 'match shouldnt be null :/';

                        var plainFileName = match[1],
                            completeFileName =  file;

                        // Create and configure the object that will read and parse the markdown
                        var mkTask = new MarkdownFileReader(plainFileName, completeFileName);
                        mkTask.setVerbose(settings.verbose);

                        // parse the file,
                        return mkTask.parse()
                            // then extract some metadata out of it
                            .map(tap(fileReader => self.analyzeMarkdownFileReader(fileReader)))
                            // and if anything fails, append some error information to the promise
                            .catch(error =>
                                Task.reject(new MarkdownReaderError(error, mkTask))
                            );

                    });

                // Return a promise that will be resolved once all the markdown files are parsed
                return Task.all(tasks);
            });
    };


    /**
     * TODO: Revisit this
     */
    analyzeMarkdownFileReader (mdFileReader: MarkdownFileReader) {
        return this.trigger("md-file-parsed", mdFileReader);
    };


}

export class MarkdownReaderError extends Error {
    type = 'MarkdownReaderError';

    constructor (error: Error, public reader: MarkdownFileReader) {
        super(error.message);
        this.stack = error.stack;
    }
}


