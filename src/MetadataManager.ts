import * as fs from 'fs';
const crypto = require("crypto");
const when = require("when");
const { green, grey } = require("colors");
interface JSonML {

}

interface WhatRef {

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

interface WhatRef2 {
    loc: Array<Locs>;
    query: string; //??
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
    query: string; // == WhatRef2.query
    refhash: string;
}

interface Metadata {
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
}


export class MetadataManager {
    constructor (private settings: any) {

    }

    metadata?: Metadata;
    /**
     * Creates the basic structure for the metadata.
     */
    private initialize () {
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
    save () {
        var self = this;
        // TODO: move to Task
        return when.promise(function(resolve: any, reject: any) {
            var metadataFileName = self.settings.outputDir + "/metadata.json";
            var metadataStr = JSON.stringify(self.metadata, null, "    ");

            fs.writeFile(metadataFileName, metadataStr, function(err){
                if (err) {
                    return reject(err);
                }
                console.log(green("Metadata written to ") + grey(metadataFileName));
                resolve();
            });
        });
    };

    /**
     * It gives you the not found references
     */
    getNotFoundList () {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }
        return this.metadata.notFound;
    };

    /**
     * TODO: probably refactor and document
     */
    renameThisMethod (markdownReader: any, codeReader: any) {
        markdownReader.on("md-file-parsed", "createJsonMLMetadata", this.createJsonMLMetadata.bind(this));
        markdownReader.on("md-file-parsed", "createHrMdMetadata", this.createHrMdMetadata.bind(this));
        markdownReader.on("md-file-parsed", "createHrCodeMetadata", this.createHrCodeMetadata.bind(this));

        codeReader.on("code-file-read", "updateHrMdMetadata", this.updateHrMdMetadata.bind(this),["updateHrCodeMetadata"]);
        codeReader.on("code-file-read", "updateHrCodeMetadata", this.updateHrCodeMetadata.bind(this));
        codeReader.on("code-file-read", "updateNotFound", this.updateNotFound.bind(this),["updateHrCodeMetadata"]);
    }

    createJsonMLMetadata (mdFileReader: any) {
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
     * @param {MarkdownFileReader} mdFileReader The object that has parsed the markdown file, and has the references
     */
    createHrMdMetadata (mdFileReader: any) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        var refs = mdFileReader.getReferences();
        // The hrMd represents the metadata of this file
        this.metadata.hrMd[mdFileReader.plainFileName] = {
            // TODO: Get from package json or something
            "version" : "0.0.1",
            "filehash" : mdFileReader.filehash,
            "refs" : refs
        };
    };

    updateHrMdMetadata (codeFileReader: any) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
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
                        from: codeFileReader.results[refhash].range[0],
                        to: codeFileReader.results[refhash].range[1]
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
    updateNotFound (codeFileReader: any) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

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
    createHrCodeMetadata (mdFileReader: any) {
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

    updateHrCodeMetadata (codeFileReader: any) {
        if (typeof this.metadata === "undefined") {
            throw new Error("Metadata not initialized yet");
        }

        // Update the hrCode part
        var hrCode = this.metadata.hrCode[codeFileReader.src];
        var refhash, found, snippet, md5;
        hrCode.filehash = codeFileReader.md5;
        for (refhash in codeFileReader.results) {
            found = codeFileReader.results[refhash].found;
            hrCode.refs[refhash].found = found;
            if (found) {
                snippet = codeFileReader.results[refhash].snippet;
                md5 = crypto.createHash("md5").update(snippet).digest("hex");

                hrCode.refs[refhash].snippet = snippet;
                hrCode.refs[refhash].snippetHash = md5;
                hrCode.refs[refhash].char = {
                    from: codeFileReader.results[refhash].range[0],
                    to: codeFileReader.results[refhash].range[1]
                };
            }
        }
    };
}

