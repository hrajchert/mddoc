export const MarkdownReader   = require("./src/MarkdownReader").MarkdownReader;
import { CodeReader } from './src/CodeReader';
export const CodeIncluder     = require("./src/CodeIncluder").CodeIncluder;
import { MetadataManager } from './src/MetadataManager';
export const GeneratorManager = require("./src/generator/GeneratorManager").getGeneratorManager();

const when = require("when");
const sequence = require("when/sequence");

// TODO: Library shouldnt have colors
const { red, grey } = require("colors");

let _metadataManager: MetadataManager | null = null;

let _mdReader: any = null;

let _codeReader: CodeReader | null = null;

let _codeIncluder: any = null;

let _verbose = true;

export const verbose = (v: boolean) => _verbose = v;

export interface Settings {
    verbose: boolean;
}
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
    GeneratorManager.initialize(metadata, settings);
}

export function getMetadataManager () {
    return _metadataManager;
};

// ------------------------------
// --     STEPS DEFINITION     --
// ------------------------------

interface StepError {
    step: string;
    err: {
        msg: string;
        stack: string;
    }
}

function normalizeError(step: string, error: any): StepError {
    return {
        step,
        err: error instanceof Error ?
            {msg: error.message, stack: error.stack || ''} :
            {msg: '' + error, stack: ''}
    };
}

export function readMarkdown () {
    if (_codeReader === null) {
        throw 'Markdown reader is not initialized';
    }
    return _mdReader.parse().otherwise(function(mdErr: any){
        console.log(red("Could not parse the markdown"));
        if (mdErr.reader) {
            console.log("in file " + grey(mdErr.reader.completeFileName));
        }

        return when.reject(normalizeError("markdown parser", mdErr));
    });
};

// TODO: Eventually call this read references, as it should read all sort of documents, not just code
export function readCode () {
    if (_codeReader === null) {
        throw 'Code reader is not initialized';
    }
    return _codeReader.read().otherwise(function(err: any) {
        console.log(red("Could not read the code"));
        if (err.reader) {
            console.log("in file " + grey(err.reader.src));
        }

        return when.reject(normalizeError("code reader", err));
    });
}

export function saveMetadata () {
    if (_metadataManager === null) {
        throw 'Metadata manager is not initialized';
    }
    return _metadataManager.save().otherwise(function(err: any) {
        console.log(red("Could not write the metadata"));
        console.log(err);
        return when.reject(normalizeError("save metadata", err));
    });
}

export function replaceReferences () {
    if (_codeIncluder === null) {
        throw 'Code includer is not initialized';
    }

    try {
        _codeIncluder.include();
        return when.resolve();
    } catch (e) {
        return when.reject(normalizeError("code includer", e));
    }

}

export function generateOutput () {
    return GeneratorManager.generate().otherwise(function(err: any) {
        console.log(red("Could not generate the HTML"));
        console.log(err);
        return when.reject(normalizeError("Output Generator", err));
    });

};


export function run (steps: any[]) {
    return sequence(steps).then(function(){
        if (_metadataManager === null) {
            throw 'Metadata manager is not initialized';
        }

        // I dont like this, quite much
        return _metadataManager.getPlainMetadata();
    });
};


// ------------------------------
// --     OTHER INCLUDES       --
// ------------------------------
export const utils  = require("./src/utils");
export const config = require("./src/config");
