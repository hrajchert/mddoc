import { Task } from "@ts-task/task";
import { walkDir } from "../utils/ts-task-fs-utils/walk-dir.js";
import { MarkdownFileReader } from "./markdown-file-reader.js";
import { EventPromiseMixin } from "../EventPromise.js";
import { Prettify } from "../utils/typescript.js";
import { VerboseSettings } from "../core/index.js";

export type MarkdownReaderSettings = Prettify<
  VerboseSettings & {
    inputDir: string;
    inputExclude?: string | readonly string[] | undefined;
  }
>;

/**
 * Walks the documentation folder, also known as input dir, and parses the markdown files
 * in it
 */
export function parseMarkdownFiles(settings: MarkdownReaderSettings, store: EventPromiseMixin) {
  const walkDirOptions = settings.inputExclude ? { exclude: settings.inputExclude } : {};
  // Walk the input dir recursively, get a list of all files
  return walkDir(settings.inputDir, walkDirOptions).chain((files) => {
    const mdre = /(.*)\.md$/;

    // Precalculate the lenght of the name of the input dir
    const dirNameLength = settings.inputDir.length;

    // TODO: If there are too many input files this will try to read them all, which can cause
    // a too many open files error. I have to divide the work in chunks for each input file.
    // Or even better use a different function that only gets me the md files

    const tasks = files
      // Check that the file is a markdown file
      .map((file) => ({
        file,
        match: file.substr(dirNameLength + 1).match(mdre),
      }))
      .filter(({ match }) => match)
      .map(({ file, match }) => {
        if (match === null) throw "match shouldnt be null :/";

        const plainFileName = match[1];
        const completeFileName = file;

        // Create and configure the object that will read and parse the markdown
        const reader = new MarkdownFileReader(plainFileName, completeFileName);
        reader.setVerbose(settings.verbose);

        // parse the file,
        return (
          reader
            .parse()
            // then extract some metadata out of it
            // TODO: Replace with redux
            .chain((fileReader) => Task.fromPromise(store.trigger("md-file-parsed", fileReader)))
            // and if anything fails, append some error information to the promise
            .catch((error) => Task.reject(new MarkdownReaderError(error, reader)))
        );
      });

    // Return a promise that will be resolved once all the markdown files are parsed
    return Task.all(tasks);
  });
}

export class MarkdownReaderError extends Error {
  type = "MarkdownReaderError";

  constructor(
    error: Error,
    public reader: MarkdownFileReader,
  ) {
    super(error.message);
    if (error.stack) {
      this.stack = error.stack;
    }
  }
}
