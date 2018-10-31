import * as fs from 'fs';
import { ICodeFinderLineQuery } from './code-reader/CodeFinderQueryLine';
import { IFileReaderQuery } from './code-reader/CodeFinderQueryJsText';
import { writeFileCreateDir } from './utils/ts-task-fs-utils/writeFileCreateDir';
import { tap } from './utils/tap';
import { MarkdownFileReader } from './markdown-parser';
import { CodeFileReader, IFoundResult } from './code-reader/CodeFileReader';
const crypto = require("crypto");
const { green, grey } = require("colors");

export type  JSonML = unknown;

export type Directive = 'code_inc' | 'code_ref' | 'code_todo' | 'code_warning';

interface WhatRef {
    found: boolean;
    directive: Directive;
    jsonml: JSonML[];
    src: string;
    refhash: string;
}

interface Loc1 {
    mdRef: {
        found: boolean;
        snippetHash: string;
        char: {
            from: number,
            to: number
        }
    }
}

interface Loc2{
    // mdFileReader.completeFileName
    file: string;
    // mdFileReader.plainFileName,
    md: string;
    line: number;
};

type Locs = Loc1 | Loc2

// What to look for in the referenced file
export type RefQuery = IFileReaderQuery | ICodeFinderLineQuery;


export interface WhatRef2 {
    loc: Array<Locs>;
    query: RefQuery;
    snippetHash: string;
    found: boolean;
    snippet: string; //?
    char: {
        from: number,
        to: number
    }
}

interface MarkdownToCodeReference {
    version: string,
    filehash: string,
    refs: {[what: string]: WhatRef}
}

interface CodeToMarkdownReference {
    version: string;
    refs: {[what: string]: WhatRef2}
    filehash?: string;
}

interface NotFoundReference {
    loc: Array<Locs>,
    src: string
    query: RefQuery;
    refhash: string;
}

export interface Metadata {
    jsonml: {
        [plainFileName: string]: JSonML
    };
    hrMd: {
        [plainFileName: string]: MarkdownToCodeReference
    };
    hrCode: {
        [src: string]: CodeToMarkdownReference
    };
    notFound: NotFoundReference[];

    // TODO: This shouldn't be here, it's only here because it's needed in the templates
    renderedFragments?: {
        [mdTemplate: string]: string
    }
}

export interface MetadataManagerSettings {
    outputDir?: string;
}

export function saveMetadataTo (metadata: Metadata, outputDir?: string) {
    // TODO: Remove optional
    if (typeof outputDir === 'undefined') throw 'outputDir shouldnt be undefined';
    var metadataFileName = outputDir + "/metadata.json";
    var metadataStr = JSON.stringify(metadata, null, "    ");
    return writeFileCreateDir(metadataFileName, metadataStr)
        .map(tap(_ => console.log(green("Metadata written to ") + grey(metadataFileName))))
}

const EventPromise = require("./EventPromise");

export class MetadataManager {

    eventPromise: any;

    constructor () {
        this.eventPromise = EventPromise.create();
        this.eventPromise.on("md-file-parsed", "createJsonMLMetadata", this.createJsonMLMetadata.bind(this));
        this.eventPromise.on("md-file-parsed", "createHrMdMetadata", this.createHrMdMetadata.bind(this));
        this.eventPromise.on("md-file-parsed", "createHrCodeMetadata", this.createHrCodeMetadata.bind(this));

        this.eventPromise.on("code-file-read", "updateHrMdMetadata", this.updateHrMdMetadata.bind(this),["updateHrCodeMetadata"]);
        this.eventPromise.on("code-file-read", "updateHrCodeMetadata", this.updateHrCodeMetadata.bind(this));
        this.eventPromise.on("code-file-read", "updateNotFound", this.updateNotFound.bind(this),["updateHrCodeMetadata"]);
    }

    metadata?: Metadata;
    /**
     * Creates the basic structure for the metadata.
     */
    initialize () {
        this.metadata = {
            // The JsonML that later on will become the HTML
            jsonml: {},
            // Holds the references from the markdown to the code
            hrMd: {},
            // Holds the inferred references from the code to the markdown
            hrCode: {},
            // Holds the missing references
            notFound: []
        };

        // Make sure the jsonml doesn't get saved into disk
        Object.defineProperty(this.metadata, "jsonml",{enumerable:false});
    };

    /**
     * Expose the metadata.
     * TODO: This shouldn't exists
    */
    getPlainMetadata () {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }
        return this.metadata;
    };
    /**
     * Write the metadata to disk
     */


    /**
     * It gives you the not found references
     */
    getNotFoundList () {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }
        return this.metadata.notFound;
    };

    createJsonMLMetadata (mdFileReader: MarkdownFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }
        // The jsonml goes directly
        this.metadata.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml;
    };

    /**
     * @summary Creates the metadata information of a Markdown file
     * @desc    This method is called when a Markdown file is parsed. TODO: I think eventually this
     *          method will only extract the refhash of each markdown, if this is even required at ALL!
     * @param  mdFileReader The object that has parsed the markdown file, and has the references
     */
    createHrMdMetadata (mdFileReader: MarkdownFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        var refs = mdFileReader.getReferences();
        // The hrMd represents the metadata of this file
        this.metadata.hrMd[mdFileReader.plainFileName] = {
            // TODO: Get from package json or something
            "version" : "0.0.1",
            "filehash" : mdFileReader.filehash as string,
            "refs" : refs as any // TODO: Big problem here!!
        };
    };

    updateHrMdMetadata (codeFileReader: CodeFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        if (typeof codeFileReader.results === 'undefined') {
            return;
        }

        const hrCode = this.metadata.hrCode[codeFileReader.src];
        // Update the hrMd part
        for (var refhash in codeFileReader.results) {
            var loc = hrCode.refs[refhash].loc;

            for(var i = 0; i < loc.length ; i++ ) {
                var hrMdRef = (loc[i] as Loc1).mdRef;
                let found = hrCode.refs[refhash].found;
                hrMdRef.found = found;
                if (found) {
                    // TODO: Decide if I want to have or not the snippet in hdMd
                    // hrMdRef.snippet = hrCode.refs[refhash].snippet;
                    hrMdRef.snippetHash = hrCode.refs[refhash].snippetHash;
                    hrMdRef.char = {
                        // TODO: Warning, why am I assuming found here!
                        from: (codeFileReader.results[refhash] as IFoundResult).range[0],
                        to: (codeFileReader.results[refhash] as IFoundResult).range[1]
                    };
                }
            }
        }
    };
    /**
     * This represents a reference that wasn't found
     * @typedef {Object} NotFoundRef
     * @property {Array.<RefLoc>}   loc     Where is this reference defined
     * @property {String}           src     The file that is referencing
     * @property {RefQuery}         query   The reference query that wasn't found
     * @property {String}           refhash A unique id that identifies the reference. Do I need this?
     */

    /**
     * TODO: comment
     */
    updateNotFound (codeFileReader: CodeFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }
        // TODO: probably should go away
        if (typeof codeFileReader.results === 'undefined') return;

        const hrCode = this.metadata.hrCode[codeFileReader.src];
        for (let refhash in codeFileReader.results) {
            let found = hrCode.refs[refhash].found;
            if (!found) {
                this.metadata.notFound.push({
                    loc: hrCode.refs[refhash].loc,
                    src: codeFileReader.src,
                    query: hrCode.refs[refhash].query,
                    refhash: refhash
                });
            }
        }
    }

    /**
     * Defines a location where the reference was defined.
     * @typedef {Object} RefLoc
     * @property {String}   md      Logical name of the Markdown file where the reference is defined
     * @property {String}   line    The line number inside the markdown file, where the definition starts
     * @property {String}   file    The actual file path from the project directory to the markdown file
     */

    /**
     *      // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // THIS has a ref with more explanation of the TODO, try not to loose the reference
    // in the refactor
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

     * @summary TODO: this method should be splitted soon.
     * @desc    This method is called when a Markdown file is parsed.
     * @param {MarkdownFileReader} mdFileReader The object that has parsed the markdown file, and has the references
     */
    createHrCodeMetadata (mdFileReader: MarkdownFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        const refs = mdFileReader.getReferences();

        // For each reference, add it in hrCode in its proper "file"
        for (let i = 0; i < refs.length ; i++  ) {
            const ref = refs[i];
            // console.log(mdFileReader.plainFileName + ": " + ref.lineNumber );
            let hrCodeSrc = this.metadata.hrCode[ref.src];

            if (typeof hrCodeSrc === "undefined") {
                hrCodeSrc = this.metadata.hrCode[ref.src] = {
                    "version" : "0.0.1",
                    "refs" : {}
                };
            }
            // TODO: I wont be creating a ref when setting a global var
            const loc = {
                file: mdFileReader.completeFileName,
                md: mdFileReader.plainFileName,
                line : ref.lineNumber
            };
            // Add a reference to this ref, so we can later resolve it, but dont make it enumerable, so
            // it doesnt serialize
            Object.defineProperty(loc, "mdRef", {value: ref, enumerable:false});

            const hrCodeRef = {
                loc : [loc],
                query : ref.ref,
                refhash : ref.refhash,
                // I dont like this one
                 // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // TODO: THIS has a ref explaining why I made this decision, try not to loose the reference
                // in the refactor
                // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                directive: ref.directive,
                // TODO: this were in the types, but not here... possible bug ahead
                snippetHash: "waat",
                found: true,
                snippet: "waat",
                char: { from: 0, to: 0}
                // -- til here
            };
            if (typeof hrCodeSrc.refs[ref.refhash] !== "undefined") {
                throw new Error("Duplicated reference");
                // TODO: Instead of err, warn but add loc
            }
            hrCodeSrc.refs;
            hrCodeSrc.refs[ref.refhash] = hrCodeRef;
        }
    }

    updateHrCodeMetadata (codeFileReader: CodeFileReader) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        // TODO: Probably should go away
        if (typeof codeFileReader.results === "undefined") return;

        // Update the hrCode part
        var hrCode = this.metadata.hrCode[codeFileReader.src];
        var refhash, found, snippet, md5;
        hrCode.filehash = codeFileReader.md5;
        for (refhash in codeFileReader.results) {
            const result = codeFileReader.results[refhash];
            hrCode.refs[refhash].found = result.found;
            if (result.found) {
                snippet = result.snippet;
                md5 = crypto.createHash("md5").update(snippet).digest("hex");

                hrCode.refs[refhash].snippet = snippet;
                hrCode.refs[refhash].snippetHash = md5;
                hrCode.refs[refhash].char = {
                    from: result.range[0],
                    to: result.range[1]
                };
            }
        }
    };
}

