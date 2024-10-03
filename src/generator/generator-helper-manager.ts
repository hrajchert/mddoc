import { JSonML, Metadata } from "../metadata-manager.js";
// @ts-expect-error TODO: Update markdown to markdown-it or similar
import { markdown } from "markdown";

const getHtml = (metadata: Metadata) => (mdTemplate: string) => {
  let tree;
  if (!metadata.jsonml.hasOwnProperty(mdTemplate)) {
    throw new Error(
      "We Couldn't find a md template with the name " + mdTemplate,
    );
  }
  try {
    tree = markdown.toHTMLTree(metadata.jsonml[mdTemplate]);
  } catch (e) {
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
