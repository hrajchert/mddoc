import colors from "colors";
import * as Eff from "effect/Effect";

import { includeCode } from "../code-includer.js";
import { readCodeReferences } from "../code-reader/code-reader.js";
import { Settings } from "../config.js";
import { getGeneratorManager } from "../generator/generator-manager.js";
import { MarkdownReaderSettings, parseMarkdownFiles } from "../markdown-parser/markdown-reader.js";
import { MetadataManager, MetadataManagerSettings, saveMetadataTo } from "../metadata/metadata-manager.js";
import { calculateStats } from "../metadata/stats.js";

import { Step } from "./steps.js";

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
export function readMarkdown(settings: MarkdownReaderSettings, metadataMgr: MetadataManager): Step {
  return {
    name: "readMarkdown",
    step: parseMarkdownFiles(settings, metadataMgr.eventPromise),
  };
}

// TODO: Eventually call this read references, as it should read all sort of documents, not just code
export function readCode(settings: VerboseSettings, metadataMgr: MetadataManager): Step {
  return {
    name: "readCode",
    step: readCodeReferences(metadataMgr.getPlainMetadata(), settings, metadataMgr.eventPromise),
  };
}

export function saveMetadata(settings: MetadataManagerSettings, mgr: MetadataManager): Step {
  return {
    name: "saveMetadata",
    step: saveMetadataTo(mgr.getPlainMetadata(), settings.outputDir),
  };
}

export function replaceReferences(metadataMgr: MetadataManager): Step {
  return {
    name: "replaceReferences",
    step: Eff.sync(() => includeCode(metadataMgr.getPlainMetadata())),
  };
}

export function generateOutput(): Step {
  return {
    name: "generateOutput",
    step: GeneratorManager.generate(),
  };
}

export function reportNotFound(metadataMgr: MetadataManager): Step {
  return {
    name: "reportNotFound",
    step: Eff.sync(() => {
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
    }),
  };
}

export function reportStats(metadataMgr: MetadataManager): Step {
  return {
    name: "reportStats",
    step: Eff.sync(() => {
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
    }),
  };
}
