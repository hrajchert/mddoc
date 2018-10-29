import { MarkdownReader, MarkdownReaderError } from "./src/MarkdownReader";
import { CodeReader, CodeReaderError } from './src/code-reader';
import { CodeIncluder } from './src/CodeIncluder';
import { MetadataManager } from './src/MetadataManager';
import { getGeneratorManager } from './src/generator/GeneratorManager';
import { Task, UnknownError } from '@ts-task/task';
import { Step, sequence } from "./src/utils/ts-task-utils/sequence";
import { renderError } from "./src/utils/explain";

const GeneratorManager = getGeneratorManager();

// TODO: Library shouldnt have colors
const { red, grey } = require("colors");

let _metadataManager: MetadataManager | null = null;

let _mdReader: MarkdownReader | null = null;

let _codeReader: CodeReader | null = null;

let _codeIncluder: any = null;

let _verbose = true;

export const verbose = (v: boolean) => _verbose = v;

export interface VerboseSettings {
    verbose: boolean;
}

type Settings = VerboseSettings;

export function initialize (settings: Settings) {
    // Initialize the metadata
    _metadataManager = new MetadataManager(settings);
    _metadataManager.initialize();

    // TODO: Avoid ASAP
    const metadata = _metadataManager.getPlainMetadata();

    // Add verbosity to the settings, dont quite like it to have it here :S
    settings.verbose = _verbose;

    // Metadata
    _mdReader = new MarkdownReader(settings);
    _codeReader = new CodeReader(metadata, settings);

    // TODO: mhmhmhm
    _metadataManager.renameThisMethod(_mdReader, _codeReader);

    // Tool
    _codeIncluder = new CodeIncluder(metadata);
    GeneratorManager.initialize(metadata, settings as any);
}

export function getMetadataManager () {
    return _metadataManager;
};

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

export function readMarkdown () {
    if (_mdReader === null) {
        return Task.reject(new LibraryNotInitialized('Markdown reader'));
    }
    return _mdReader.parse()
        .catch((mdErr) => {
            console.log(red("Could not parse the markdown"));
            if (mdErr instanceof MarkdownReaderError) {
                console.log("in file " + grey(mdErr.reader.completeFileName));
            }

            return Task.reject(normalizeError("markdown parser", mdErr));
        });
};

// TODO: Eventually call this read references, as it should read all sort of documents, not just code
export function readCode () {
    if (_codeReader === null) {
        return Task.reject(new LibraryNotInitialized('Code reader'));
    }
    return _codeReader.read()
        .catch(err => {
            console.log(red("Could not read the code"));
            if (err instanceof CodeReaderError) {
                console.log("in file " + grey(err.reader.src));
            }

            return Task.reject(normalizeError("code reader", err));
        });
}

export function saveMetadata () {
    if (_metadataManager === null) {
        return Task.reject(new LibraryNotInitialized('Metadata manager'));
    }
    return _metadataManager.save()
        .catch(err => {
            console.log(red("Could not write the metadata"));
            console.log(err);
            return Task.reject(normalizeError("save metadata", err));
        });
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

export function run<E> (steps: Step<E>[]) {
    return sequence(steps)
        .chain(() => {
            if (_metadataManager === null) {
                return Task.reject(new LibraryNotInitialized('Metadata manager'));
            }

            // I dont like this, quite much
            return Task.resolve(_metadataManager.getPlainMetadata());
        });
};


// ------------------------------
// --     OTHER INCLUDES       --
// ------------------------------
export const utils  = require("./src/utils");
export const config = require("./src/config");
