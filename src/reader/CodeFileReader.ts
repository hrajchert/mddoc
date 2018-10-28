import * as fs from 'fs';
import { IRange } from './reader-utils';
import { CodeFinderQueryJsText, isTextQuery } from './CodeFinderQueryJsText';
import { CodeFinderQueryLine, isLineQuery } from './CodeFinderQueryLine';
import { WhatRef2 } from '../MetadataManager';

var
    crypto = require("crypto"),
    esprima = require("esprima"),
    nodefn = require("when/node/function")

;

const { grey, blue } = require('colors');

interface IFoundResult {
    found: true;
    snippet: string;
    range: IRange;
}
interface INotFoundResult {
    found: false;
}

export type IFindResult = IFoundResult | INotFoundResult;

export type IFindReferenceMap = {
    [ref: string]: WhatRef2
};

export interface IFindOptions {
    references: IFindReferenceMap;
    src: string;
    verbose: boolean;
}

/**
 * Reads a file and find the references
 * @param  Object findOptions The information needed to find the references.
 *                            Inside, it must have the source file to read, and a hash
 *                            of references to find.
 */
export class CodeFileReader {
    src: string;
    references: IFindReferenceMap;
    verbose: boolean;
    source?: string;
    md5?: string;
    AST: any;
    results?: {
        [ref: string]: IFindResult
    };

    constructor (findOptions: IFindOptions) {
        if ( typeof findOptions.src === "undefined") {
            throw new Error("You need to provide a source file");
        }
        this.src = findOptions.src;

        this.references = findOptions.references;
        this.verbose = findOptions.verbose;
    }

    /**
     * This is the entry point to the class, the method that controls the inner logic.
     * It returns a promise of "this", that will be resolved once the code file is read, and
     * the references found.
     * @return Promise A promise of this
     */
    read () {
        // First we need to read the file and parse the AST
        return this.readAndParseFile()
            // Once we have the file, we need to call the right finder for each reference
            .then(() => {
                this.results = {};
                var ref, refhash, codeFinder;
                for (refhash in this.references) {
                    ref = this.references[refhash];
                    // console.log("We need to parse a reference ".yellow + refhash.grey);
                    // console.log(ref);
                    // If it has a line property,
                    if (isLineQuery(ref.query)) {
                        // console.log("Instantiating Line query ".yellow);
                        codeFinder = new CodeFinderQueryLine(this, ref.query);
                    } else if (isTextQuery(ref.query)) {
                        // console.log("Instantiating Text query ".yellow);
                        codeFinder = new CodeFinderQueryJsText(this, ref.query);
                    }

                    if (codeFinder) {
                        this.results[refhash] = codeFinder.execute();
                    } else {
                        this.results[refhash] = { found: false };
                    }
                    // console.log("This is the result:".red);
                    // console.log(this.results[refhash].snippet);
                }
                // The finders are sync, so we can just return this (thus, promise of this)
                return this;
            })
            ;
    }

    // TODO: Rename this
    readAndParseFile () {
        return nodefn.call(fs.readFile, this.src, "utf8").then((source: string) => {
            if (this.verbose) {
                console.log(blue("reading code file ") + grey(this.src));
            }

            this.source = source;
            this.md5 = crypto.createHash("md5").update(source).digest("hex");

            // TODO: maybe change this only if needed.
            this.AST = esprima.parse(source, {range:true});

            return this;
        });
    }

    private _lines?: Array<{text: string, range: IRange}>;
    get lines () {
        if (typeof this.source === 'undefined') {
            throw 'Source should be defined';
        }

        if (!this.hasOwnProperty('_lines')) {
            // console.log("Calculating lines!".inverse);
            var _lines = [];
            var charNumber = 0,
                l = this.source.split("\n"),
                i, len;
            for (i = 0; i < l.length ; i++) {
                len = l[i].length;
                _lines.push({
                    text: l[i],
                    range: [charNumber, charNumber + len]
                });
                charNumber += len;
            }
            Object.defineProperty(this, "_lines", {value: _lines});
        }
        return this._lines as Array<{text: string, range: IRange}>;
    }
}

