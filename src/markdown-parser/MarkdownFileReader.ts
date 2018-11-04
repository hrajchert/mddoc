import { RefQuery, Directive, JSonML } from "../MetadataManager";
import { readFile } from "../utils/ts-task-fs/readFile";
import * as crypto from 'crypto';

const { yellow, grey } = require("colors");

const markdown = require("markdown").markdown;

// Configure my parser
require("./MarkdownParser.js")(markdown.Markdown);

/**
 * An object that represents a reference from markdown to the code
 */
export interface BaseMarkdownReference {
    // Optional name of the reference, false if its not named
    name: string | false;
    // The path to the referenced file (normally a code file)
    src: string;

    // What to look for in the referenced file
    ref: RefQuery;

    // The line number in the markdown file where this reference start
    lineNumber: number; // or string?

    // A hash of the reference, serves to identify it.
    // It's the md5 of the part of the markdown file that has the reference
    // TODO: I should probably combine this with name into an id field
    refhash: string;

    // It gives semantics to the reference, why are we refering to this code,
    // is this a warning? a todo? do we want to include it? etc... It will
    // tell the rest of the library and tools how to render the ref, or how
    // to treat it (in a tool).
    directive: Directive;

    // TODO: this dont end up in the saved file, should model it another way
    jsonml: JSonML;
    refMl: JSonML;
}

export interface PendingMarkdownReference extends BaseMarkdownReference {
    status: 'pending';
}

export interface NotFoundMarkdownReference extends BaseMarkdownReference {
    status: 'not-found';
}

export interface FoundMarkdownReference extends BaseMarkdownReference {
    status: 'found';
    snippetHash: string;
    char: {
        from: number;
        to: number;
    }

}
export type MarkdownReference = PendingMarkdownReference | FoundMarkdownReference | NotFoundMarkdownReference;

/**
 * Class that reads a markdown file and gets references to the code out of it
 */
export class MarkdownFileReader {
    /**
     * Indicate if the parser should print verbose logging
     */
    verbose = true;

    filehash?: string;

    jsonml?: JSonML;

    /**
     * TODO: revisit why we want to have a plainFileName and not use always the completeFileName
     * @param plainFileName     The logical file path. This includes de path from inputDir to
     *                          the file without the extension e.g. "src/CodeReader.js"
     * @param completeFileName  The real file path from the working directory e.g. "docs/src/CodeReader.js.md"
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
        return readFile(self.completeFileName, "utf8").map(markdownFile => {
            if (self.verbose) {
                console.log(yellow("parsing ") + grey(self.completeFileName));
            }
            // Get an md5 of the md file
            self.filehash = crypto.createHash("md5").update(markdownFile).digest("hex");

            // Parse the markdown into JsonML
            self.jsonml = markdown.parse(markdownFile, "miMkd");

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
    private _doGetReferences (jsonml?: JSonML) {
        if (typeof jsonml === 'undefined') throw 'jsonml shouldnt be undefined';

        const references: MarkdownReference[] = [];
        // For each markdown block
        for (let blockNumber=1; blockNumber < jsonml.length ; blockNumber++) {
            const mlBlock = jsonml[blockNumber];
            // If its not an actual JsonML block, move on
            if (!Array.isArray(mlBlock)) {
                continue;
            }
            // See if this block is a code reference block
            if ( mlBlock[0] === "code_reference" ) {
                // Get the attributes from the jsonml

                const attr = JSON.parse("{"+mlBlock[1]+"}");

                // Each attribute must have a src and a ref
                // TODO: add parmenides to check the reference is correct
                if (typeof attr.src === "undefined" || typeof attr.ref === "undefined") {
                    throw new Error("Invalid reference\n" + mlBlock[1]) ;
                }

                const referingBlocks: number = attr.hasOwnProperty("referingBlocks") ? attr.referingBlocks : 1;
                let referencingMl: JSonML | null = null;
                if ( blockNumber > referingBlocks ) {
                    referencingMl = [];
                    for (let i = blockNumber - referingBlocks; i < blockNumber ; i++) {
                        referencingMl.push(jsonml[i]);
                    }
                }

                // Interpret the reference
                const ref = {
                    name       : attr.name ? attr.name : false,
                    src        : attr.src,
                    ref        : attr.ref,
                    lineNumber : mlBlock[2].lineNumber,
                    // Create a hash from the reference itself
                    refhash    : crypto.createHash("md5").update(mlBlock[1]).digest("hex"),
                    // TODO: Check this out later
                    status     : "pending",
                    jsonml     : mlBlock,
                    refMl      : referencingMl,
                    directive  : mlBlock[2].type
                } as PendingMarkdownReference;

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

