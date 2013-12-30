var fs = require("fs");
var utils = require("../../utils");
var walkDir = utils.walkDir;
var _ = require ("underscore");


var HtmlWriterFile = function (options) {
    if (!("inputFile" in options)) {
        throw new Error("You need to specify an input file");
    }
    if (!("outputFile" in options)) {
        throw new Error("You need to specify an output file");
    }

    this.inputFile = options.inputFile;
    this.outputFile = options.outputFile;
    this.renderer = options.renderer;

};

HtmlWriterFile.prototype.setMetadata = function (metadata) {
    this.metadata = metadata;
};

HtmlWriterFile.prototype.fileRendered = function(err) {
    if (err) {
        throw err;
    }
    console.log("We wrote ".green + this.outputFile.grey);
};


HtmlWriterFile.prototype.render = function() {
    var html = this.renderer.render(this.inputFile, {documentor: this.metadata.helpers});
    fs.writeFile(this.outputFile, html , this.fileRendered.bind(this));
};



var markdown = require("markdown").markdown;

function addRenderHelpers (metadata) {
    if (!("helpers" in metadata)) {
        metadata.helpers = {};
    }
    metadata.helpers.getHtml = function(mdTemplate) {
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
    };

    metadata.helpers.exportFragmentJson = function() {
        return JSON.stringify(metadata.renderedFragments, null, "   ");
    };
}



var CustomGenerator = function (metadata, settings) {
    this.metadata = metadata;
    this.settings = settings.generators.custom;
    // TODO: this should be in the HtmlWriterFile, but i dont want to create
    // one every time
    var ECT = require("ect");
    this.renderer = ECT({ root : this.settings.templateDir });

};


CustomGenerator.prototype.copyAssets = function () {
    var inputDir = this.settings.templateDir,
        outputDir = this.settings.outputDir;
    // Not sure about the partials one...
    var assetRe = /\/(css|js|images|fonts|partials)\//;

    return utils.copyDir(inputDir, outputDir, assetRe);
};

CustomGenerator.prototype.generate = function(){
    if (this.settings.copyAssets) {
        this.copyAssets();
    }

    this.metadata.renderedFragments = {};
    // TODO: This shouldnt be here, not this hardcoded:
    // For each markdown, create the html fragment
    for (var mdTemplate in this.metadata.jsonml) {
        // TODO: refactor this as well, as is copy pasted from the helper

        try {
            debugger;
            if (_.isFunction(this.metadata.jsonml[mdTemplate]) ) {
                // This is because of the template function, iuuuuu
                continue;
            }
            var tree = markdown.toHTMLTree(this.metadata.jsonml[mdTemplate]);
            var html = markdown.renderJsonML(tree);

            var outputFilename = this.settings.outputDir + "/fragment/" + mdTemplate + ".html";
            this.metadata.renderedFragments[mdTemplate] = "fragment/" + mdTemplate + ".html";

            utils.writeFileCreateDir(outputFilename, html).otherwise(function(err) {
                console.error("There was a problem writing the file", err);
            });

        } catch (e) {
            console.log("Problem with ".red + mdTemplate);
            console.log(e);
        }
    }

    addRenderHelpers(this.metadata);

    for (var i=0; i< this.settings.files.length; i++) {
        try {
            // Create the object in charge of rendering the html
            var renderObject = new HtmlWriterFile({
                inputFile: this.settings.files[i] + ".tpl",
                outputFile: this.settings.outputDir + "/" + this.settings.files[i] + ".html",
                renderer: this.renderer

            });

            // Add the metadata to it
            renderObject.setMetadata(this.metadata);

            // Generate the html
            renderObject.render();
        } catch (e) {
            // TODO: silent error :S
            console.error(e);
        }
    }
};

exports.constructor = function (metadata, settings) {
    return new CustomGenerator(metadata, settings);
};
