var fs = require("fs");
var utils = require("../../utils");
var when = require("when");

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


HtmlWriterFile.prototype.render = function() {
    var self = this;
    return when.promise(function(resolve, reject) {
        var html = self.renderer.render(self.inputFile, {documentor: self.helpers});
        fs.writeFile(self.outputFile, html ,function(err) {
            if (err) {
                reject(err);
            } else {
                console.log("We wrote ".green + self.outputFile.grey);
                resolve();
            }
        });
    });
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
    var self = this;
    return when.promise(function(resolve) {
        var promises = [];
        if (self.settings.copyAssets) {
            promises.push(self.copyAssets());
        }

        self.metadata.renderedFragments = {};

        // For each markdown, create the html fragment
        for (var mdTemplate in self.metadata.jsonml) {
            try {
                var tree = markdown.toHTMLTree(self.metadata.jsonml[mdTemplate]);
                var html = markdown.renderJsonML(tree);

                var outputFilename = self.settings.outputDir + "/fragment/" + mdTemplate + ".html";
                self.metadata.renderedFragments[mdTemplate] = "fragment/" + mdTemplate + ".html";

                promises.push(utils.writeFileCreateDir(outputFilename, html));

            } catch (e) {
                console.log("Problem with ".red + mdTemplate);
                throw e;
            }
        }

        var helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);

        for (var i=0; i< self.settings.files.length; i++) {
            // Create the object in charge of rendering the html
            var renderObject = new HtmlWriterFile({
                inputFile: self.settings.files[i] + ".tpl",
                outputFile: self.settings.outputDir + "/" + self.settings.files[i] + ".html",
                renderer: self.renderer

            });

            // ...
            renderObject.setHelpers(helpers);

            // Generate the html
            promises.push(renderObject.render());
        }

        resolve(when.all(promises));
    });

};

exports.constructor = function (metadata, settings) {
    return new CustomGenerator(metadata, settings);
};
