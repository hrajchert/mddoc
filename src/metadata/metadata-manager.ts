import * as crypto from "crypto";
import { CodeFileReader } from "../code-reader/code-file-reader.js";
import { FoundMarkdownReference, MarkdownFileReader, NotFoundMarkdownReference } from "../markdown-parser/index.js";
import { tap } from "../utils/tap.js";
import { writeFileCreateDir } from "../utils/ts-task-fs-utils/write-file-create-dir.js";
import colors from "colors";
import * as EventPromise from "../EventPromise.js";
import { EventPromiseMixin } from "../EventPromise.js";
import { JSonML, Metadata } from "./metadata.js";
const { green, grey } = colors;

export interface MetadataManagerSettings {
  outputDir: string;
}

export function saveMetadataTo(metadata: Metadata, outputDir: string) {
  const metadataFileName = `${outputDir}/metadata.json`;
  const metadataStr = JSON.stringify(metadata, null, "    ");
  return writeFileCreateDir(metadataFileName, metadataStr).map(
    tap((_) => console.log(green("Metadata written to ") + grey(metadataFileName))),
  );
}

export class MetadataManager {
  eventPromise: EventPromiseMixin;

  metadata: Metadata = {
    jsonml: {},
    hrMd: {},
    hrCode: {},
    notFound: [],
  };

  constructor() {
    this.eventPromise = EventPromise.create();
    this.eventPromise.on("md-file-parsed", "createJsonMLMetadata", this.createJsonMLMetadata.bind(this));
    this.eventPromise.on("md-file-parsed", "createHrMdMetadata", this.createHrMdMetadata.bind(this));
    this.eventPromise.on("md-file-parsed", "createHrCodeMetadata", this.createHrCodeMetadata.bind(this));

    this.eventPromise.on("code-file-read", "updateHrMdMetadata", this.updateHrMdMetadata.bind(this), ["updateHrCodeMetadata"]);
    this.eventPromise.on("code-file-read", "updateHrCodeMetadata", this.updateHrCodeMetadata.bind(this));
    this.eventPromise.on("code-file-read", "updateNotFound", this.updateNotFound.bind(this), ["updateHrCodeMetadata"]);

    // Make sure the jsonml doesn't get saved into disk
    Object.defineProperty(this.metadata, "jsonml", { enumerable: false });
  }

  /**
   * Expose the metadata.
   * TODO: This shouldn't exists
   */
  getPlainMetadata() {
    return this.metadata;
  }

  /**
   * It gives you the not found references
   */
  getNotFoundList() {
    return this.metadata.notFound;
  }

  createJsonMLMetadata(mdFileReader: unknown) {
    if (!(mdFileReader instanceof MarkdownFileReader)) {
      throw new Error("mdFileReader must be an instance of MarkdownFileReader");
    }
    // The jsonml goes directly
    this.metadata.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml as JSonML;
  }

  /**
   * @summary Creates the metadata information of a Markdown file
   * @desc    This method is called when a Markdown file is parsed. TODO: I think eventually this
   *          method will only extract the refhash of each markdown, if this is even required at ALL!
   * @param  mdFileReader The object that has parsed the markdown file, and has the references
   */
  createHrMdMetadata(mdFileReader: unknown) {
    if (!(mdFileReader instanceof MarkdownFileReader)) {
      throw new Error("mdFileReader must be an instance of MarkdownFileReader");
    }
    const refs = mdFileReader.getReferences();
    // The hrMd represents the metadata of this file
    this.metadata.hrMd[mdFileReader.plainFileName] = {
      // TODO: Move this to the global scope of the metadata
      version: "0.0.1",
      filehash: mdFileReader.filehash as string,
      refs: refs,
    };
  }

  updateHrMdMetadata(codeFileReader: unknown) {
    if (!(codeFileReader instanceof CodeFileReader)) {
      throw new Error("codeFileReader must be an instance of CodeFileReader");
    }

    const hrCode = this.metadata.hrCode[codeFileReader.src];
    // For each reference in the code file
    for (const refhash in codeFileReader.results) {
      const loc = hrCode.refs[refhash].loc;
      // Update the status of the markdown that references it
      for (let i = 0; i < loc.length; i++) {
        const hrMdRef = loc[i].mdRef;
        // WARNING: instead of relying on mdRef being present I should modify
        // the data structure to make it easy to search.
        if (typeof hrMdRef === "undefined") throw "mdRef is not in memory :O";
        const findResult = codeFileReader.results[refhash];

        if (findResult.found) {
          // Treat the reference as a found reference
          const foundRef = hrMdRef as FoundMarkdownReference;
          // TODO: Decide if I want to have or not the snippet in hdMd
          // foundRef.snippet = hrCode.refs[refhash].snippet;
          foundRef.status = "found";
          foundRef.snippetHash = hrCode.refs[refhash].snippetHash;
          foundRef.char = {
            from: findResult.range[0],
            to: findResult.range[1],
          };
        } else {
          // Treat the reference as a not found reference
          const notFoundRef = hrMdRef as NotFoundMarkdownReference;
          notFoundRef.status = "not-found";
        }
      }
    }
  }

  /**
   * TODO: comment
   */
  updateNotFound(codeFileReader: unknown) {
    if (!(codeFileReader instanceof CodeFileReader)) {
      throw new Error("codeFileReader must be an instance of CodeFileReader");
    }

    const hrCode = this.metadata.hrCode[codeFileReader.src];
    for (const refhash in codeFileReader.results) {
      const result = codeFileReader.results[refhash];
      if (!result.found) {
        this.metadata.notFound.push({
          loc: hrCode.refs[refhash].loc,
          src: codeFileReader.src,
          query: hrCode.refs[refhash].query,
          refhash: refhash,
          reason: result.reason,
        });
      }
    }
  }

  /**
   * @summary TODO: this method should be splitted soon.
   * @desc    This method is called when a Markdown file is parsed.
   * @param mdFileReader The object that has parsed the markdown file, and has the references
   */
  createHrCodeMetadata(mdFileReader: unknown) {
    if (!(mdFileReader instanceof MarkdownFileReader)) {
      throw new Error("Invalid argument: mdFileReader must be an instance of MarkdownFileReader");
    }

    const refs = mdFileReader.getReferences();

    // For each reference, add it in hrCode in its proper "file"
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      // console.log(mdFileReader.plainFileName + ": " + ref.lineNumber );
      let hrCodeSrc = this.metadata.hrCode[ref.src];

      if (typeof hrCodeSrc === "undefined") {
        hrCodeSrc = this.metadata.hrCode[ref.src] = {
          version: "0.0.1",
          refs: {},
        };
      }
      // TODO: I wont be creating a ref when setting a global var
      const loc = {
        file: mdFileReader.completeFileName,
        md: mdFileReader.plainFileName,
        line: ref.lineNumber,
      };
      // Add a reference to this ref, so we can later resolve it, but dont make it enumerable, so
      // it doesnt serialize
      Object.defineProperty(loc, "mdRef", { value: ref, enumerable: false });

      const hrCodeRef = {
        loc: [loc],
        query: ref.ref,
        refhash: ref.refhash,
        // I dont like this one (Refs in doc)
        directive: ref.directive,
        // TODO: this were in the types, but not here... possible bug ahead
        snippetHash: "waat",
        found: true,
        snippet: "waat",
        char: { from: 0, to: 0 },
        // -- til here
      };
      if (typeof hrCodeSrc.refs[ref.refhash] !== "undefined") {
        throw new Error("Duplicated reference");
        // TODO: Instead of err, warn but add loc
      }
      hrCodeSrc.refs[ref.refhash] = hrCodeRef;
    }
  }

  updateHrCodeMetadata(codeFileReader: unknown) {
    if (!(codeFileReader instanceof CodeFileReader)) {
      throw new Error("Invalid argument: codeFileReader must be an instance of CodeFileReader");
    }

    // Update the hrCode part
    const hrCode = this.metadata.hrCode[codeFileReader.src];
    // TODO: See if we should error if md5 is not present
    if (codeFileReader.md5) {
      hrCode.filehash = codeFileReader.md5;
    }
    for (const refhash in codeFileReader.results) {
      const result = codeFileReader.results[refhash];
      hrCode.refs[refhash].found = result.found;
      if (result.found) {
        const snippet = result.snippet;
        const md5 = crypto.createHash("md5").update(snippet).digest("hex");

        hrCode.refs[refhash].snippet = snippet;
        hrCode.refs[refhash].snippetHash = md5;
        hrCode.refs[refhash].char = {
          from: result.range[0],
          to: result.range[1],
        };
      }
    }
  }
}
