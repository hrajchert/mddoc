import { Metadata } from "./metadata.js";

/** Summary stats of the processed metadata */
export interface Stats {
  // Total number of markdown files analyzed
  analyzedFiles: number;
  // Number of markdown files that contain at least one reference
  referencingFiles: number;
  // Total number of references across all markdown files
  references: number;
  // Number of not found references
  notFoundReferences: number;
}

export const calculateStats = (metadata: Metadata): Stats => {
  return {
    analyzedFiles: Object.keys(metadata.hrMd).length,
    referencingFiles: Object.values(metadata.hrMd).filter((mdRef) => mdRef.refs.length > 0).length,
    references: Object.values(metadata.hrMd).reduce((acc, mdRef) => acc + mdRef.refs.length, 0),
    notFoundReferences: metadata.notFound.length, // Added line to count not found references
  };
};
