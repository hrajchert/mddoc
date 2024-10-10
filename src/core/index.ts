import { Task, UnknownError } from "@ts-task/task";
import colors from "colors";

import { includeCode } from "../code-includer.js";
import { CodeReaderError, readCodeReferences } from "../code-reader/code-reader.js";
import { Settings } from "../config.js";
import { getGeneratorManager } from "../generator/generator-manager.js";
import { MarkdownReaderError, MarkdownReaderSettings, parseMarkdownFiles } from "../markdown-parser/markdown-reader.js";
import { MetadataManager, MetadataManagerSettings, saveMetadataTo } from "../metadata/metadata-manager.js";
import { calculateStats } from "../metadata/stats.js";
import { renderError } from "../utils/explain.js";

const GeneratorManager = getGeneratorManager();

// TODO: Library shouldnt have unix colors, I should use a data type for
//       enhanced messages, with formatting.
const { red, grey, green, blue, yellow } = colors;

export interface VerboseSettings {
  verbose: boolean;
}

export function initialize(settings: Settings) {
  // Initialize the metadata
  const mgr = new MetadataManager();

  const metadata = mgr.getPlainMetadata();

  GeneratorManager.initialize(metadata, settings);
  return mgr;
}

// ------------------------------
// --     STEPS DEFINITION     --
// ------------------------------

export class StepError {
  type = "StepError";

  constructor(
    public step: string,
    public err: Error,
  ) {}

  explain() {
    let ans = `There was a problem in the step "${this.step}"\n`;
    ans += renderError(this.err);
    return ans;
  }
}

function normalizeError(step: string, error: Error): StepError {
  return new StepError(step, error);
}

export function readMarkdown(settings: MarkdownReaderSettings, metadataMgr: MetadataManager) {
  return () => {
    return parseMarkdownFiles(settings, metadataMgr.eventPromise).catch((mdErr) => {
      console.log(red("Could not parse the markdown"));
      if (mdErr instanceof MarkdownReaderError) {
        console.log("in file " + grey(mdErr.reader.completeFileName));
      }
      return Task.reject(normalizeError("markdown parser", mdErr));
    });
  };
}

// TODO: Eventually call this read references, as it should read all sort of documents, not just code
export function readCode(settings: VerboseSettings, metadataMgr: MetadataManager) {
  return () => {
    return readCodeReferences(metadataMgr.getPlainMetadata(), settings, metadataMgr.eventPromise).catch((err) => {
      console.log(red("Could not read the code"));
      if (err instanceof CodeReaderError) {
        console.log("in file " + grey(err.reader.src));
      }
      return Task.reject(normalizeError("code reader", err));
    });
  };
}

export function saveMetadata(settings: MetadataManagerSettings, mgr: MetadataManager) {
  return function () {
    return saveMetadataTo(mgr.getPlainMetadata(), settings.outputDir).catch((err) => {
      console.log(red("Could not write the metadata"));
      console.log(err);
      return Task.reject(normalizeError("save metadata", err));
    });
  };
}

export function replaceReferences(metadataMgr: MetadataManager) {
  return () => {
    let task: Task<void, UnknownError | StepError>;

    try {
      includeCode(metadataMgr.getPlainMetadata());
      task = Task.resolve(void 0);
    } catch (e) {
      // TODO: I should check if e is an error
      task = Task.reject(normalizeError("code includer", e as Error));
    }
    return task;
  };
}

export function generateOutput() {
  return GeneratorManager.generate().catch(function (err) {
    console.log(red("Could not generate the HTML"));
    console.log(err);
    return Task.reject(normalizeError("Output Generator", err));
  });
}

export function reportNotFound(metadataMgr: MetadataManager) {
  return () => {
    const notFoundReferences = metadataMgr.metadata.notFound;
    if (notFoundReferences.length > 0) {
      let notFoundMessages = red("Warning:") + ` ${notFoundReferences.length} references were not found\n`;
      notFoundMessages += notFoundReferences
        .map((ref) => {
          const from = ref.loc.map((loc) => `${loc.file}:${loc.line}`).join(", ");

          return (
            `* ref: ${grey(from)}\n` +
            `\tReferencing\n` +
            `\t\t${grey(ref.src)}\n` +
            `\tUsing query\n` +
            `\t\t${JSON.stringify(ref.query)}\n` +
            `\tBecause:\n` +
            `\t\t${ref.reason}`
          );
        })
        .join("\n\n");
      console.log(notFoundMessages);
    }
    return Task.resolve(void 0);
  };
}

export function reportStats(metadataMgr: MetadataManager) {
  return () => {
    const stats = calculateStats(metadataMgr.getPlainMetadata());
    console.log(green("\nMDDoc Stats:"));
    console.log(
      blue(" - Analyzed Files:    ") +
        yellow(stats.analyzedFiles.toString()) +
        grey(" (Total number of markdown files analyzed)"),
    );
    console.log(
      blue(" - Referencing Files: ") +
        yellow(stats.referencingFiles.toString()) +
        grey(" (Number of markdown files with at least one reference)"),
    );
    console.log(
      blue(" - Total References:  ") +
        yellow(stats.references.toString()) +
        grey(" (Total number of references across all markdown files)"),
    );
    console.log(
      blue(" - Not Found References: ") +
        yellow(stats.notFoundReferences.toString()) +
        grey(" (Number of references that were not found)"),
    );
    return Task.resolve(void 0);
  };
}
