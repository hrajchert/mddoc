import * as crypto from 'crypto';
import { CodeFileReader } from './code-reader/CodeFileReader';
import { IFileReaderQuery } from './code-reader/CodeFinderQueryJsText';
import { ICodeFinderLineQuery } from './code-reader/CodeFinderQueryLine';
import { FoundMarkdownReference, MarkdownFileReader, MarkdownReference, NotFoundMarkdownReference } from './markdown-parser';
import { tap } from './utils/tap';
import { writeFileCreateDir } from './utils/ts-task-fs-utils/writeFileCreateDir';

const { green, grey } = require('colors');

// TODO: convert any to unknown and check stuff. This structure is holding other stuff as well (refhash??)
export type  JSonML = Array<string | any[] | {refhash?: string, id?: string, class?: string}>;

export type Directive = 'code_inc' | 'code_ref' | 'code_todo' | 'code_warning';

interface MarkdownToCodeReference {
    version: string;
    filehash: string;
    refs: MarkdownReference[];
}


/**
 * Defines a location where the reference was defined.
 */
interface RefLoc {
    // mdFileReader.completeFileName
    // The actual file path from the project directory to the markdown file
    file: string;
    // mdFileReader.plainFileName,
    // Logical name of the Markdown file where the reference is defined
    md: string;
    // The line number inside the markdown file, where the definition starts
    line: number;
    // TODO: try to handle this different when possible
    // This is a memory reference to the MarkdownReference to be able to modify it in the
    // updateHrMdMetadata without having to look for it. But this is not stored to file
    mdRef?: MarkdownReference;
}


// What to look for in the referenced file
export type RefQuery = IFileReaderQuery | ICodeFinderLineQuery;

interface FileInverseReference {
    // TODO: remove
    version: string;
    refs: {[refid: string]: InverseReference}; // refid it's normally the refhash, but it could potentially be the name
    // This is the md5 of the file being referenced
    filehash?: string;
}


export interface InverseReference {
    // An array of places where this reference is being used. Basically who is referencing
    // this code. It's an array because the idea is that if you used a named reference you could
    // have multiple places using the same reference.
    loc: Array<RefLoc>;
    // What is being used to make a reference to this
    query: RefQuery;
    // If we found the reference or not. TODO: this should be a sum type with different
    // types for references that were found and the ones that werent
    found: boolean;
    // If found, this contains the portion of the file being referenced
    snippet: string;
    // And this is an md5sum of it
    snippetHash: string;
    // Where in the file was the snippet found
    char: {
        from: number,
        to: number
    };
}

/**
 * This represents a reference that wasn't found
 */
interface NotFoundReference {
    // Where is this reference defined
    loc: Array<RefLoc>;
    // The file that is being referenced
    src: string;
    // The reference query that wasn't found
    query: RefQuery;
    // A unique id that identifies the reference. TODO: Do I need this?
    refhash: string;
    // An explanation on why the reference was not found
    reason: string;
}

export interface Metadata {
    // The JsonML that later on will become the HTML
    jsonml: {
        [plainFileName: string]: JSonML
    };

    // Holds the results of parsing the markdowns and extracting the references
    // from the markdown to the code. TODO: we should be making this more generic and
    // adding the ability to be a source reference from any file, to any file
    hrMd: {
        [plainFileName: string]: MarkdownToCodeReference
    };

    // Holds the inverse reference from hrMd. Basically for each file that it's being referenced
    // it hold a list of all the places that references to that file.
    hrCode: {
        [filePath: string]: FileInverseReference
    };

    // Holds the missing references
    notFound: NotFoundReference[];

    // TODO: This shouldn't be here, it's only here because it's needed in the templates
    // possible solution is to have a redux state that each reducer adds the global key
    // that it cares about, and we could have that for all the plugins we need
    renderedFragments?: {
        [mdTemplate: string]: string
    };
}

export interface MetadataManagerSettings {
    outputDir?: string;
}

export function saveMetadataTo (metadata: Metadata, outputDir?: string) {
    // TODO: Remove optional
    if (typeof outputDir === 'undefined') throw 'outputDir shouldnt be undefined';
    const metadataFileName = outputDir + '/metadata.json';
    const metadataStr = JSON.stringify(metadata, null, '    ');
    return writeFileCreateDir(metadataFileName, metadataStr)
        .map(tap(_ => console.log(green('Metadata written to ') + grey(metadataFileName))));
}

const EventPromise = require('./EventPromise');

export class MetadataManager {

    eventPromise: any;

    metadata: Metadata = {
        jsonml: {},
        hrMd: {},
        hrCode: {},
        notFound: []
    };

    constructor () {
        this.eventPromise = EventPromise.create();
        this.eventPromise.on('md-file-parsed', 'createJsonMLMetadata', this.createJsonMLMetadata.bind(this));
        this.eventPromise.on('md-file-parsed', 'createHrMdMetadata', this.createHrMdMetadata.bind(this));
        this.eventPromise.on('md-file-parsed', 'createHrCodeMetadata', this.createHrCodeMetadata.bind(this));

        this.eventPromise.on('code-file-read', 'updateHrMdMetadata', this.updateHrMdMetadata.bind(this), ['updateHrCodeMetadata']);
        this.eventPromise.on('code-file-read', 'updateHrCodeMetadata', this.updateHrCodeMetadata.bind(this));
        this.eventPromise.on('code-file-read', 'updateNotFound', this.updateNotFound.bind(this), ['updateHrCodeMetadata']);

        // Make sure the jsonml doesn't get saved into disk
        Object.defineProperty(this.metadata, 'jsonml', {enumerable: false});
    }


    /**
     * Expose the metadata.
     * TODO: This shouldn't exists
     */
    getPlainMetadata () {
        return this.metadata;
    }

    /**
     * It gives you the not found references
     */
    getNotFoundList () {
        return this.metadata.notFound;
    }

    createJsonMLMetadata (mdFileReader: MarkdownFileReader) {
        // The jsonml goes directly
        this.metadata.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml as JSonML;
    }

    /**
     * @summary Creates the metadata information of a Markdown file
     * @desc    This method is called when a Markdown file is parsed. TODO: I think eventually this
     *          method will only extract the refhash of each markdown, if this is even required at ALL!
     * @param  mdFileReader The object that has parsed the markdown file, and has the references
     */
    createHrMdMetadata (mdFileReader: MarkdownFileReader) {
        const refs = mdFileReader.getReferences();
        // The hrMd represents the metadata of this file
        this.metadata.hrMd[mdFileReader.plainFileName] = {
            // TODO: Move this to the global scope of the metadata
            version: '0.0.1',
            filehash: mdFileReader.filehash as string,
            refs: refs
        };
    }

    updateHrMdMetadata (codeFileReader: CodeFileReader) {
        const hrCode = this.metadata.hrCode[codeFileReader.src];
        // For each reference in the code file
        for (const refhash in codeFileReader.results) {
            const loc = hrCode.refs[refhash].loc;
            // Update the status of the markdown that references it
            for (let i = 0; i < loc.length ; i++ ) {
                const hrMdRef = loc[i].mdRef;
                // WARNING: instead of relying on mdRef being present I should modify
                // the data structure to make it easy to search.
                if (typeof hrMdRef === 'undefined') throw 'mdRef is not in memory :O';
                const findResult = codeFileReader.results[refhash];

                if (findResult.found) {
                    // Treat the reference as a found reference
                    const foundRef = hrMdRef as FoundMarkdownReference;
                    // TODO: Decide if I want to have or not the snippet in hdMd
                    // foundRef.snippet = hrCode.refs[refhash].snippet;
                    foundRef.status = 'found';
                    foundRef.snippetHash = hrCode.refs[refhash].snippetHash;
                    foundRef.char = {
                        from: findResult.range[0],
                        to: findResult.range[1]
                    };
                } else {
                    // Treat the reference as a not found reference
                    const notFoundRef = hrMdRef as NotFoundMarkdownReference;
                    notFoundRef.status = 'not-found';
                }
            }
        }
    }


    /**
     * TODO: comment
     */
    updateNotFound (codeFileReader: CodeFileReader) {
        const hrCode = this.metadata.hrCode[codeFileReader.src];
        for (const refhash in codeFileReader.results) {
            const result = codeFileReader.results[refhash];
            if (!result.found) {

                this.metadata.notFound.push({
                    loc: hrCode.refs[refhash].loc,
                    src: codeFileReader.src,
                    query: hrCode.refs[refhash].query,
                    refhash: refhash,
                    reason: result.reason
                });
            }
        }
    }


    /**
     * @summary TODO: this method should be splitted soon.
     * @desc    This method is called when a Markdown file is parsed.
     * @param mdFileReader The object that has parsed the markdown file, and has the references
     */
    createHrCodeMetadata (mdFileReader: MarkdownFileReader) {
        const refs = mdFileReader.getReferences();

        // For each reference, add it in hrCode in its proper "file"
        for (let i = 0; i < refs.length ; i++  ) {
            const ref = refs[i];
            // console.log(mdFileReader.plainFileName + ": " + ref.lineNumber );
            let hrCodeSrc = this.metadata.hrCode[ref.src];

            if (typeof hrCodeSrc === 'undefined') {
                hrCodeSrc = this.metadata.hrCode[ref.src] = {
                    'version' : '0.0.1',
                    'refs' : {}
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
            Object.defineProperty(loc, 'mdRef', {value: ref, enumerable: false});

            const hrCodeRef = {
                loc : [loc],
                query : ref.ref,
                refhash : ref.refhash,
                // I dont like this one (Refs in doc)
                directive: ref.directive,
                // TODO: this were in the types, but not here... possible bug ahead
                snippetHash: 'waat',
                found: true,
                snippet: 'waat',
                char: { from: 0, to: 0}
                // -- til here
            };
            if (typeof hrCodeSrc.refs[ref.refhash] !== 'undefined') {
                throw new Error('Duplicated reference');
                // TODO: Instead of err, warn but add loc
            }
            hrCodeSrc.refs[ref.refhash] = hrCodeRef;
        }
    }

    updateHrCodeMetadata (codeFileReader: CodeFileReader) {
        // Update the hrCode part
        const hrCode = this.metadata.hrCode[codeFileReader.src];

        hrCode.filehash = codeFileReader.md5;
        for (const refhash in codeFileReader.results) {
            const result = codeFileReader.results[refhash];
            hrCode.refs[refhash].found = result.found;
            if (result.found) {
                const snippet = result.snippet;
                const md5 = crypto.createHash('md5').update(snippet).digest('hex');

                hrCode.refs[refhash].snippet = snippet;
                hrCode.refs[refhash].snippetHash = md5;
                hrCode.refs[refhash].char = {
                    from: result.range[0],
                    to: result.range[1]
                };
            }
        }
    }
}

