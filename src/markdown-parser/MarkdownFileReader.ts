import { RefQuery, Directive, JSonML } from "../MetadataManager";
import { readFile } from "../utils/ts-task-fs/readFile";
import * as crypto from 'crypto';

const { yellow, grey } = require("colors");

const markdown = require("markdown").markdown;

// Configure my parser
require("./MarkdownParser.js")(markdown.Markdown);

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

/**
 * Class that reads a markdown file and gets references to the code out of it
 */
export class MarkdownFileReader {
    /**
     * Indicate if the parser should print verbose logging
     */
    verbose = true;

    filehash?: string;

    jsonml?: JSonML[];

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
    private _doGetReferences (jsonml?: JSonML[]) {
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

