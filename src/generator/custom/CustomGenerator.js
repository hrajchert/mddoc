
var utils = require("../../utils");
var when = require("when");


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
        var html = self.renderer.render(self.inputFile, {mddoc: self.helpers});
        utils.writeFileCreateDir(self.outputFile, html).then(
            function () {
                console.log("We wrote ".green + self.outputFile.grey);
                resolve();
            },
            function (err) {
                console.log("eee ", err);
                reject(err);
            }
        );
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
    var assetRe = /\/(css|js|images|fonts)\//;

    return utils.copyDir(inputDir, outputDir, assetRe);
};


CustomGenerator.prototype.generate = function(helpers){
    var self = this;
    return when.promise(function(resolve) {
        var promises = [];
        if (self.settings.copyAssets) {
            promises.push(self.copyAssets());
        }

        // TODO: Remove the files settings, probably walk the dir for .tpl files
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
