var fs = require("fs");
var utils = require("../../utils");
var walkDir = utils.walkDir;

var GeneratorHelperManager = require("../GeneratorHelperManager");

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

HtmlWriterFile.prototype.setHelpers = function (helpers) {
    this.helpers = helpers;
};

HtmlWriterFile.prototype.fileRendered = function(err) {
    if (err) {
        throw err;
    }
    console.log("We wrote ".green + this.outputFile.grey);
};


HtmlWriterFile.prototype.render = function() {
    var html = this.renderer.render(this.inputFile, {documentor: this.helpers});
    fs.writeFile(this.outputFile, html , this.fileRendered.bind(this));
};






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

// TODO: remove
var markdown = require("markdown").markdown;


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

    var helpers = GeneratorHelperManager.addRenderHelpers(this.metadata);

    for (var i=0; i< this.settings.files.length; i++) {
        try {
            // Create the object in charge of rendering the html
            var renderObject = new HtmlWriterFile({
                inputFile: this.settings.files[i] + ".tpl",
                outputFile: this.settings.outputDir + "/" + this.settings.files[i] + ".html",
                renderer: this.renderer

            });

            // ...
            renderObject.setHelpers(helpers);

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
