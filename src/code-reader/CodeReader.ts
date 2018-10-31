import { VerboseSettings } from '../../index';
import { CodeFileReader } from './CodeFileReader';
import { Metadata } from '../MetadataManager';
import { Task } from '@ts-task/task';
import { tap } from '../utils/tap';

export class CodeReader {
    constructor (public metadata: Metadata, public settings: VerboseSettings) {
    }

    read (store: any) {
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
                // TODO: Replace with redux
                .map(tap(reader => store.trigger("code-file-read", reader)))
                // If anything fails, append the failing reader
                .catch(error => Task.reject(new CodeReaderError(error, codeFileReader)))
            ;
        })
        // console.log(this.metadata.hrCode);
        return Task.all(tasks);
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
