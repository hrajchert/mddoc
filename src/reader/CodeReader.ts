var
    EventPromise = require("../EventPromise"),
    when = require("when");
;

import { Settings } from '../../index';
import { CodeFileReader } from './CodeFileReader';

export class CodeReader {
    eventPromise: any;
    constructor (public metadata: any, public settings: Settings) {
        this.eventPromise = EventPromise.create();
    }

    on (...args: any[]) {
        this.eventPromise.on(...args);
    }

    trigger (...args: any[]) {
        this.eventPromise.trigger(...args);
    }

    read () {
        var hrCode = this.metadata.hrCode;
        var promises = [];
        var codeFileReader;

        // Method to add context to an error in the parsing of a md file
        const self = this;
        var handleError = function(err: any) {
            err.reader = self;
            return when.reject(err);
        };

        for (var file in hrCode) {
            codeFileReader = new CodeFileReader({
                src: file,
                references: hrCode[file].refs,
                verbose: this.settings.verbose
            });

            promises.push(
                // Read the file
                codeFileReader.read()
                // Then get the metadata out of it
                .then(this.updateMetadata.bind(this))
                // If anything fails, append the failing reader
                .otherwise(handleError.bind(codeFileReader))
            );
        }
        // console.log(this.metadata.hrCode);
        return when.all(promises);
    };

    updateMetadata (codeFileReader: any) {
        return this.trigger("code-file-read", codeFileReader);
    };

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
