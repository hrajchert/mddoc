// @ts-expect-error TODO: Update markdown to markdown-it or similar
import { markdown } from "markdown";

import { JSonML } from "../markdown-parser/jsonml.js";
import { Metadata } from "../metadata/metadata.js";

const getHtml = (metadata: Metadata) => (mdTemplate: string) => {
  let tree;
  if (!Object.prototype.hasOwnProperty.call(metadata.jsonml, mdTemplate)) {
    throw new Error("We Couldn't find a md template with the name " + mdTemplate);
  }
  try {
    tree = markdown.toHTMLTree(metadata.jsonml[mdTemplate]);
  } catch {
    throw new Error("Couldnt create html for template " + mdTemplate);
  }

  return markdown.renderJsonML(tree);
};

const exportFragmentJson = (metadata: Metadata) => () => {
  return JSON.stringify(metadata.renderedFragments, null, "   ");
};

export function getRenderHelpers(metadata: Metadata) {
  return {
    getHtml: getHtml(metadata),
    exportFragmentJson: exportFragmentJson(metadata),
  };
}

export function renderMlBlock(jsonml: JSonML) {
  try {
    const tree = markdown.toHTMLTree(jsonml);
    return markdown.renderJsonML(tree);
  } catch (e) {
    // TODO: Fix silent error
    console.log(e);
    return null;
  }
}
