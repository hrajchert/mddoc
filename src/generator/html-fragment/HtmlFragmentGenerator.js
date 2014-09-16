
var utils = require("../../utils");
var when = require("when"),
    _     = require("underscore");

// TODO: remove
var markdown = require("markdown").markdown;

module.exports = function(PluginResolver) {
    var BaseGenerator = PluginResolver.BaseGenerator;

    var HtmlFragmentGenerator = function (metadata, settings) {
        this.metadata = metadata;
        this.settings = settings.generators["html-fragment"];
    };
    // Extend from the base generator
    _.extend(HtmlFragmentGenerator.prototype, BaseGenerator.prototype);


    HtmlFragmentGenerator.prototype.generate = function(){
        var self = this;
        return when.promise(function(resolve) {
            var promises = [];

            self.metadata.renderedFragments = {};

            // For each markdown, create the html fragment
            for (var mdTemplate in self.metadata.jsonml) {
                try {
                    var tree = markdown.toHTMLTree(self.metadata.jsonml[mdTemplate]);
                    var html = markdown.renderJsonML(tree);

                    var outputFilename = self.settings.outputDir + "/" + mdTemplate + ".html";
                    // mhmhmh TODO: This is sooo hardcoded
                    self.metadata.renderedFragments[mdTemplate] = "fragment/" + mdTemplate + ".html";

                    promises.push(utils.writeFileCreateDir(outputFilename, html));

                } catch (e) {
                    console.log("Problem with ".red + mdTemplate);
                    throw e;
                }
            }


            resolve(when.all(promises));
        });

    };

    return {
        createGenerator : function (metadata, settings) {
            return new HtmlFragmentGenerator(metadata, settings);
        }
    };
};
