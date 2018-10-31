import { MarkdownReaderError, MarkdownReaderSettings, parseMarkdownFiles } from "./src/markdown-parser";
import { CodeReaderError, readCodeReferences } from './src/code-reader';
import { CodeIncluder } from './src/CodeIncluder';
import { MetadataManager, saveMetadataTo, MetadataManagerSettings } from './src/MetadataManager';
import { getGeneratorManager } from './src/generator/GeneratorManager';
import { Task, UnknownError } from '@ts-task/task';
import { Step, sequence } from "./src/utils/ts-task-utils/sequence";
import { renderError } from "./src/utils/explain";


const GeneratorManager = getGeneratorManager();

// TODO: Library shouldnt have colors
const { red, grey } = require("colors");

let _codeIncluder: any = null;

export interface VerboseSettings {
    verbose: boolean;
}

type Settings = VerboseSettings;

export function initialize (settings: Settings) {
    // Initialize the metadata
    const mgr = new MetadataManager();
    mgr.initialize();

    // TODO: Avoid ASAP
    const metadata = mgr.getPlainMetadata();

    // Tool
    _codeIncluder = new CodeIncluder(metadata);
    GeneratorManager.initialize(metadata, settings as any);
    return mgr;
}

// ------------------------------
// --     STEPS DEFINITION     --
// ------------------------------

export class LibraryNotInitialized {
    type = 'LibraryNotInitialized';
    constructor (public module: string) {

    }

    explain () {
        return `The library wasnt initialized correctly ${this.module}`;
    }
}

export class StepError {
    type = "StepError";

    constructor (public step: string, public err: Error) {

    }

    explain () {
        let ans = `There was a problem in the step "${this.step}"\n`;
        ans += renderError(this.err);
        return ans;
    }
}


function normalizeError(step: string, error: Error): StepError {
    return new StepError(step, error);
}

export function readMarkdown (settings: MarkdownReaderSettings, metadataMgr: MetadataManager) {
    return () => {
        return parseMarkdownFiles(settings, metadataMgr.eventPromise)
            .catch((mdErr) => {
                console.log(red("Could not parse the markdown"));
                if (mdErr instanceof MarkdownReaderError) {
                    console.log("in file " + grey(mdErr.reader.completeFileName));
                }

                return Task.reject(normalizeError("markdown parser", mdErr));
            });
    }
};

// TODO: Eventually call this read references, as it should read all sort of documents, not just code
export function readCode (settings: VerboseSettings, metadataMgr: MetadataManager) {
    return () => {
        return readCodeReferences(metadataMgr.getPlainMetadata(), settings, metadataMgr.eventPromise)
            .catch(err => {
                console.log(red("Could not read the code"));
                if (err instanceof CodeReaderError) {
                    console.log("in file " + grey(err.reader.src));
                }

                return Task.reject(normalizeError("code reader", err));
            });
    }
}

export function saveMetadata (settings: MetadataManagerSettings, mgr: MetadataManager) {
    return function () {
        return saveMetadataTo(mgr.getPlainMetadata(), settings.outputDir)
            .catch(err => {
                console.log(red("Could not write the metadata"));
                console.log(err);
                return Task.reject(normalizeError("save metadata", err));
            });
    }
}

export function replaceReferences () {
    let task: Task<void, LibraryNotInitialized | UnknownError | StepError>;

    try {
        if (_codeIncluder === null) {
            task = Task.reject(new LibraryNotInitialized('Code includer'));
        } else {
            _codeIncluder.include();
            task = Task.resolve(void 0);
        }
    } catch (e) {
        task = Task.reject(normalizeError("code includer", e));
    }
    return task;
}

export function generateOutput () {
    return GeneratorManager.generate()
        .catch(function(err) {
            console.log(red("Could not generate the HTML"));
            console.log(err);
            return Task.reject(normalizeError("Output Generator", err));
        });
};
