import { Task } from "@ts-task/task";
import { VerboseSettings } from "../lib/index.js";
import { Metadata } from "../metadata/metadata.js";
import { CodeFileReader } from "./code-file-reader.js";
import { EventPromiseMixin } from "../EventPromise.js";

export function readCodeReferences(metadata: Metadata, settings: VerboseSettings, store: EventPromiseMixin) {
  const hrCode = metadata.hrCode;

  const files = Object.keys(hrCode);
  const tasks = files.map((filePath) => {
    const codeFileReader = new CodeFileReader({
      filePath,
      references: hrCode[filePath].refs,
      verbose: settings.verbose,
    });

    // Read the file
    return (
      codeFileReader
        .read()
        // Then update the metadata out of it
        // TODO: Replace with redux
        .chain((reader) => Task.fromPromise(store.trigger("code-file-read", reader)))
        // If anything fails, append the failing reader
        .catch((error) => Task.reject(new CodeReaderError(error, codeFileReader)))
    );
  });
  return Task.all(tasks);
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
}
