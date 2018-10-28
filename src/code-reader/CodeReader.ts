const EventPromise = require("../EventPromise");

import { VerboseSettings } from '../../index';
import { CodeFileReader } from './CodeFileReader';
import { Metadata } from '../MetadataManager';
import { Task } from '@ts-task/task';
import { tap } from '../ts-task-utils';

export class CodeReader {
    eventPromise: any;
    constructor (public metadata: Metadata, public settings: VerboseSettings) {
        this.eventPromise = EventPromise.create();
    }

    on (...args: any[]) {
        this.eventPromise.on(...args);
    }

    trigger (...args: any[]) {
        this.eventPromise.trigger(...args);
    }

    read () {
        const hrCode = this.metadata.hrCode;

        const files = Object.keys(hrCode);
        const tasks = files.map(file => {
            const codeFileReader = new CodeFileReader({
                src: file,
                references: hrCode[file].refs,
                verbose: this.settings.verbose
            });

            // Read the file
            return codeFileReader.read()
                // Then update the metadata out of it
                .map(tap(reader => this.updateMetadata(reader)))
                // If anything fails, append the failing reader
                .catch(error => Task.reject(new CodeReaderError(error, codeFileReader)))
            ;
        })
        // console.log(this.metadata.hrCode);
        return Task.all(tasks);
    };

    updateMetadata (codeFileReader: CodeFileReader) {
        this.trigger("code-file-read", codeFileReader);
    };
}

export class CodeReaderError extends Error {
    type = "CodeReaderError";
    constructor (err: Error, public reader: CodeFileReader) {
        super(err.message);
        this.stack = err.stack;

    }
}

// var finder = new CodeFileReader({
//     src: sourceFile,
//     query: {
//         text: stringToFind
//     }
// });

// // Find the snippet
// var findPromise = finder.find();

// // Print it if found
// findPromise.then(function(result) {
//     var snippet = result.snippet;
//     console.log(snippet);
//     var md5 = crypto.createHash("md5").update(snippet).digest("hex");
//     console.log(md5);

// });

// // Log error if not
// findPromise.otherwise(function(err){
//     console.log("Coudln't find snippet: " + err);
// });
