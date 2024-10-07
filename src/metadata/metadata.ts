import { IFileReaderQuery } from "../code-reader/code-finder-query-js-text.js";
import { ICodeFinderLineQuery } from "../code-reader/code-finder-query-line.js";
import { MarkdownReference } from "../markdown-parser/index.js";

// TODO: JSonML should be in a markdown parsing folder and in here we should have a mddoc DSL instead.
// TODO: convert any to unknown and check stuff. This structure is holding other stuff as well (refhash??)
export type JSonML = Array<string | any[] | { refhash?: string; id?: string; class?: string }>;

export type Directive = "code_inc" | "code_ref" | "code_todo" | "code_warning";

interface MarkdownToCodeReference {
  version: string;
  filehash: string;
  refs: MarkdownReference[];
}

/**
 * Defines a location where the reference was defined.
 */
interface RefLoc {
  // mdFileReader.completeFileName
  // The actual file path from the project directory to the markdown file
  file: string;
  // mdFileReader.plainFileName,
  // Logical name of the Markdown file where the reference is defined
  md: string;
  // The line number inside the markdown file, where the definition starts
  line: number;
  // TODO: try to handle this different when possible
  // This is a memory reference to the MarkdownReference to be able to modify it in the
  // updateHrMdMetadata without having to look for it. But this is not stored to file
  mdRef?: MarkdownReference;
}

// What to look for in the referenced file
export type RefQuery = IFileReaderQuery | ICodeFinderLineQuery;

interface FileInverseReference {
  // TODO: remove
  version: string;
  refs: { [refid: string]: InverseReference }; // refid it's normally the refhash, but it could potentially be the name
  // This is the md5 of the file being referenced
  filehash?: string;
}

export interface InverseReference {
  // An array of places where this reference is being used. Basically who is referencing
  // this code. It's an array because the idea is that if you used a named reference you could
  // have multiple places using the same reference.
  loc: Array<RefLoc>;
  // What is being used to make a reference to this
  query: RefQuery;
  // If we found the reference or not. TODO: this should be a sum type with different
  // types for references that were found and the ones that werent
  found: boolean;
  // If found, this contains the portion of the file being referenced
  snippet: string;
  // And this is an md5sum of it
  snippetHash: string;
  // Where in the file was the snippet found
  char: {
    from: number;
    to: number;
  };
}

/**
 * This represents a reference that wasn't found
 */
interface NotFoundReference {
  // Where is this reference defined
  loc: Array<RefLoc>;
  // The file that is being referenced
  src: string;
  // The reference query that wasn't found
  query: RefQuery;
  // A unique id that identifies the reference. TODO: Do I need this?
  refhash: string;
  // An explanation on why the reference was not found
  reason: string;
}

export interface Metadata {
  // The JsonML that later on will become the HTML
  jsonml: {
    [plainFileName: string]: JSonML;
  };

  // Holds the results of parsing the markdowns and extracting the references
  // from the markdown to the code. TODO: we should be making this more generic and
  // adding the ability to be a source reference from any file, to any file
  hrMd: {
    [plainFileName: string]: MarkdownToCodeReference;
  };

  // Holds the inverse reference from hrMd. Basically for each file that it's being referenced
  // it hold a list of all the places that references to that file.
  hrCode: {
    [filePath: string]: FileInverseReference;
  };

  // Holds the missing references
  notFound: NotFoundReference[];

  // TODO: This shouldn't be here, it's only here because it's needed in the templates
  // possible solution is to have a redux state that each reducer adds the global key
  // that it cares about, and we could have that for all the plugins we need
  renderedFragments?: {
    [mdTemplate: string]: string;
  };
}
