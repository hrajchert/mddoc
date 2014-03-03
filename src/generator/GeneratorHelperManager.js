var markdown = require("markdown").markdown;
var _ = require("underscore");

function getHtml (metadata, mdTemplate) {
    var tree;
    if (!metadata.jsonml.hasOwnProperty(mdTemplate)) {
        throw new Error("We Couldn't find a md template with the name " + mdTemplate);
    }
    try {
        tree = markdown.toHTMLTree(metadata.jsonml[mdTemplate]);
    }catch (e) {
        console.log(e);
        throw new Error("Couldnt create html for template " + mdTemplate);
    }

    return markdown.renderJsonML(tree);
}

function exportFragmentJson (metadata) {
    return JSON.stringify(metadata.renderedFragments, null, "   ");
}

function getRenderHelpers (metadata) {
    return {
        getHtml: _.partial(getHtml, metadata),
        exportFragmentJson: _.partial(exportFragmentJson, metadata)
    };
}

function renderMlBlock (jsonml) {
    try {
        var tree = markdown.toHTMLTree(jsonml);
        return markdown.renderJsonML(tree);
    } catch (e) {
        // TODO: Fix silent error
        console.log(e);
        return null;
    }

}


exports.getRenderHelpers = getRenderHelpers;
exports.renderMlBlock = renderMlBlock;
