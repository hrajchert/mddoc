import { walkDir } from "../utils/ts-task-fs-utils/walkDir";
import { Task } from "@ts-task/task";
import { tap } from "../utils/tap";
import { VerboseSettings } from "../..";
import { MarkdownFileReader } from "./MarkdownFileReader";

export type MarkdownReaderSettings = {
    inputDir: string;
    inputExclude?: string;
} & VerboseSettings;

/**
 * Walks the documentation folder, also known as input dir, and parses the markdown files
 * in it
 */
export function parseMarkdownFiles (settings: MarkdownReaderSettings, store: any) {
    // Walk the input dir recursively, get a list of all files
    return walkDir(settings.inputDir, {exclude: settings.inputExclude})
        .chain(files => {
            var mdre = /(.*)\.md$/;

            // Precalculate the lenght of the name of the input dir
            var dirNameLength = settings.inputDir.length;

            // TODO: If there are too many input files this will try to read them all, which can cause
            // a too many open files error. I have to divide the work in chunks
            // For each input file
            const tasks = files
                // Check that the file is a markdown file
                .map(file => ({file, match: file.substr(dirNameLength+1).match(mdre)}))
                .filter(({match}) => match)
                .map(({file, match}) => {
                    if (match === null) throw 'match shouldnt be null :/';

                    var plainFileName = match[1],
                        completeFileName =  file;

                    // Create and configure the object that will read and parse the markdown
                    var mkTask = new MarkdownFileReader(plainFileName, completeFileName);
                    mkTask.setVerbose(settings.verbose);

                    // parse the file,
                    return mkTask.parse()
                        // then extract some metadata out of it
                        // TODO: Replace with redux
                        .map(tap(fileReader => store.trigger("md-file-parsed", fileReader)))
                        // and if anything fails, append some error information to the promise
                        .catch(error =>
                            Task.reject(new MarkdownReaderError(error, mkTask))
                        );

                });

            // Return a promise that will be resolved once all the markdown files are parsed
            return Task.all(tasks);
        });
}


export class MarkdownReaderError extends Error {
    type = 'MarkdownReaderError';

    constructor (error: Error, public reader: MarkdownFileReader) {
        super(error.message);
        this.stack = error.stack;
    }
}