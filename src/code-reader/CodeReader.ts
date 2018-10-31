import { VerboseSettings } from '../../index';
import { CodeFileReader } from './CodeFileReader';
import { Metadata } from '../MetadataManager';
import { Task } from '@ts-task/task';
import { tap } from '../utils/tap';

export function readCodeReferences (metadata: Metadata, settings: VerboseSettings, store: any) {
    const hrCode = metadata.hrCode;

    const files = Object.keys(hrCode);
    const tasks = files.map(file => {
        const codeFileReader = new CodeFileReader({
            src: file,
            references: hrCode[file].refs,
            verbose: settings.verbose
        });

        // Read the file
        return codeFileReader.read()
            // Then update the metadata out of it
            // TODO: Replace with redux
            .map(tap(reader => store.trigger("code-file-read", reader)))
            // If anything fails, append the failing reader
            .catch(error => Task.reject(new CodeReaderError(error, codeFileReader)))
        ;
    })
    // console.log(metadata.hrCode);
    return Task.all(tasks);
}

export class CodeReaderError extends Error {
    type = "CodeReaderError";
    constructor (err: Error, public reader: CodeFileReader) {
        super(err.message);
        this.stack = err.stack;

    }
}
