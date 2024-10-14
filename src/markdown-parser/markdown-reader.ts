import { pipe } from "effect";
import * as Eff from "effect/Effect";

import { VerboseSettings } from "../core/index.js";
import { EventPromiseMixin } from "../EventPromise.js";
import { toEffect } from "../utils/effect/ts-task.js";
import { walkDir } from "../utils/ts-task-fs-utils/walk-dir.js";
import { Prettify } from "../utils/typescript.js";

import { MarkdownFileReader } from "./markdown-file-reader.js";

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
  return Eff.gen(function* () {
    const walkDirOptions = settings.inputExclude ? { exclude: settings.inputExclude } : {};
    // Walk the input dir recursively, get a list of all files
    const files = yield* pipe(
      toEffect(walkDir(settings.inputDir, walkDirOptions)),
      Eff.mapError((error) => new MarkdownReaderError(error)),
    );
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
      .map(({ file, match }) =>
        Eff.gen(function* () {
          if (match === null) return Eff.die("match shouldnt be null :/");

          const plainFileName = match[1];
          const completeFileName = file;

          // Create and configure the object that will read and parse the markdown
          const reader = new MarkdownFileReader(plainFileName, completeFileName);
          reader.setVerbose(settings.verbose);

          // const fileReader = yield* toEffect(reader.parse());
          // return yield* Eff.mapError((error) => new MarkdownReaderError(error, reader, completeFileName))(
          //   Eff.promise(() => store.trigger("md-file-parsed", fileReader)),
          // );
          return yield* pipe(
            toEffect(reader.parse()),
            Eff.andThen((fileReader) => Eff.promise(() => store.trigger("md-file-parsed", fileReader))),
            Eff.mapError((error) => new MarkdownFileReaderError(error, reader, completeFileName)),
          );
        }),
      );

    return yield* Eff.all(tasks);
  });
}
export class MarkdownReaderError {
  _tag = "MarkdownReaderError";

  constructor(public error: NodeJS.ErrnoException) {}
  explain() {
    return `Error reading the sources\n${this.error.message}`;
  }
}

export class MarkdownFileReaderError extends Error {
  _tag = "MarkdownFileReaderError";

  constructor(
    error: unknown,
    public reader: MarkdownFileReader,
    public file: string,
  ) {
    super(error instanceof Error ? error.message : String(error));
    // TODO: Check Effect Cause's
    if (error instanceof Error && error.stack) {
      this.stack = error.stack;
    }
  }
  explain() {
    return `Error parsing the markdown file ${this.file}\n${this.message}`;
  }
}
