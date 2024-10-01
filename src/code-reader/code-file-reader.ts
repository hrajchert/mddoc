import { Task } from '@ts-task/task';
import * as ts from 'typescript';
import { InverseReference } from '../metadata-manager.js';
import { readFile } from '../utils/ts-task-fs/read-file.js';
import { CodeFinderQueryJsText, isTextQuery } from './code-finder-query-js-text.js';
import { CodeFinderQueryLine, isLineQuery } from './code-finder-query-line.js';
import { IQueriable, IRange } from './reader-utils.js';

import { caseError } from '@ts-task/utils';
import * as crypto from 'crypto';
import { isErrnoException } from '../utils/is-errno-exception.js';
import colors from 'colors';
const { grey, blue } = colors;
export interface IFoundResult {
    found: true;
    snippet: string;
    range: IRange;
}
export interface INotFoundResult {
    found: false;
    reason: string;
}

export type IFindResult = IFoundResult | INotFoundResult;

export type IFindReferenceMap = {
    [ref: string]: InverseReference
};

export interface IFindOptions {
    references: IFindReferenceMap;
    filePath: string;
    verbose: boolean;
}

/**
 * Reads a file and find the references
 * @param  Object findOptions The information needed to find the references.
 *                            Inside, it must have the source file to read, and a hash
 *                            of references to find.
 */
export class CodeFileReader {

    // The filename (TODO: maybe change to path)
    src: string;
    references: IFindReferenceMap;
    verbose: boolean;
    // The code as string
    source?: string;
    // The MD5 of the source
    md5?: string;

    AST: ts.SourceFile | null = null;

    results: {
        [ref: string]: IFindResult
    } = {};

    private  _lines?: Array<{text: string, range: IRange}>;

    get lines () {
        if (typeof this.source === 'undefined') {
            throw 'Source should be defined';
        }

        if (!this.hasOwnProperty('_lines')) {
            // console.log("Calculating lines!".inverse);
            const _lines = [];
            let charNumber = 0;
            const l = this.source.split('\n');

            for (let i = 0; i < l.length ; i++) {
                const len = l[i].length;
                _lines.push({
                    text: l[i],
                    range: [charNumber, charNumber + len]
                });
                charNumber += len;
            }
            Object.defineProperty(this, '_lines', {value: _lines});
        }
        return this._lines as Array<{text: string, range: IRange}>;
    }

    constructor (findOptions: IFindOptions) {
        this.src = findOptions.filePath;

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
            .map(() => {
                for (const refhash in this.references) {
                    const ref = this.references[refhash];
                    // console.log("We need to parse a reference ".yellow + refhash.grey);
                    // console.log(ref);
                    // If it has a line property,
                    let codeFinder: IQueriable | null = null;
                    if (isLineQuery(ref.query)) {
                        // console.log("Instantiating Line query ".yellow);
                        codeFinder = new CodeFinderQueryLine(this, ref.query);
                    } else if (isTextQuery(ref.query)) {
                        // console.log("Instantiating Text query ".yellow);
                        codeFinder = new CodeFinderQueryJsText(this, ref.query);
                    }

                    this.results[refhash] = codeFinder ?
                        codeFinder.execute() :
                        { found: false, reason: 'Invalid query type' };
                    // console.log("This is the result:".red);
                    // console.log(this.results[refhash].snippet);
                }
                // The finders are sync, so we can just return this (thus, promise of this)
                return this;
            })
            .catch(caseError(
                isErrnoException,
                err => {
                    for (const refhash in this.references) {
                        this.results[refhash] = { found: false, reason: `cant open file ${err.message}` };
                    }
                    return Task.resolve(this);
                }
            ))
            ;
    }

    // TODO: Rename this
    readAndParseFile () {
        return readFile(this.src, 'utf8').map(source => {
            if (this.verbose) {
                console.log(blue('reading code file ') + grey(this.src));
            }

            this.source = source.toString();
            this.md5 = crypto.createHash('md5').update(this.source).digest('hex');

            // TODO: maybe change this only if needed.
            this.AST = ts.createSourceFile(this.src, source.toString(), ts.ScriptTarget.Latest);

            return this;
        });
    }
}

