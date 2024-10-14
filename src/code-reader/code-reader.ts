import { pipe } from "effect";
import * as Eff from "effect/Effect";

import { VerboseSettings } from "../core/index.js";
import { EventPromiseMixin } from "../EventPromise.js";
import { Metadata } from "../metadata/metadata.js";
import { toEffect } from "../utils/effect/ts-task.js";

import { CodeFileReader } from "./code-file-reader.js";

export function readCodeReferences(metadata: Metadata, settings: VerboseSettings, store: EventPromiseMixin) {
  return Eff.gen(function* () {
    const hrCode = metadata.hrCode;

    const files = Object.keys(hrCode);
    const tasks = files.map((filePath) => {
      const codeFileReader = new CodeFileReader({
        filePath,
        references: hrCode[filePath].refs,
        verbose: settings.verbose,
      });
      // Read the file
      return pipe(
        toEffect(codeFileReader.read()),
        Eff.andThen((reader) => Eff.promise(() => store.trigger("code-file-read", reader))),
        Eff.mapError((error) => new CodeReaderError(error, codeFileReader)),
      );
    });
    return yield* Eff.all(tasks);
  });
}

export class CodeReaderError extends Error {
  type = "CodeReaderError";
  constructor(
    err: Error,
    public reader: CodeFileReader,
  ) {
    super(err.message);
    if (err.stack) {
      this.stack = err.stack;
    }
  }
  explain() {
    return `Error reading the code file ${this.reader.src}\n${this.message}`;
  }
}
