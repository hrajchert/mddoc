var fs = require("fs");

var HtmlWriterFile = function (options, metadata) {
    if (!("inputFile" in options)) {
        throw "You need to specify an input file";
    }
    if (!("outputFile" in options)) {
        throw "You need to specify an output file";
    }

    this.inputFile = options.inputFile;
    this.outputFile = options.outputFile;
    this.renderer = options.renderer;
    this.metadata = metadata;
};


HtmlWriterFile.prototype.fileRendered = function(err) {
    if (err) {
        throw err;
    }
    console.log("We wrote ".green + this.outputFile.grey);
};


HtmlWriterFile.prototype.render = function() {
    var html = this.renderer.render(this.inputFile, {documentor: this.metadata.jsonml});
    fs.writeFile(this.outputFile, html , this.fileRendered.bind(this));

};



var HtmlWriter = function (metadata, settings) {
    this.metadata = metadata;
    this.settings = settings;
    // TODO: this should be in the HtmlWriterFile, but i dont want to create
    // one every time
    var ECT = require("ect");
    this.renderer = ECT({ root : settings.inputDir });

};


var markdown = require("markdown").markdown;

function addRenderHelpers (metadata) {
    metadata.jsonml.getHtml = function(mdTemplate) {
        var tree;
        if (!metadata.jsonml.hasOwnProperty(mdTemplate)) {
            throw "We Couldnt find a md template with the name " + mdTemplate;
        }
        try {
            tree = markdown.toHTMLTree(metadata.jsonml[mdTemplate]);
        }catch (e) {
            console.log(e);
            throw "Couldnt create html for template " + mdTemplate;
        }

        return markdown.renderJsonML(tree);
    };
}

HtmlWriter.prototype.generate = function(){


    addRenderHelpers(this.metadata);

    for (var i=0; i< this.settings.files.length; i++) {
        try {
            var renderObject = new HtmlWriterFile({
                inputFile: this.settings.files[i] + ".ect",
                outputFile: this.settings.outputDir + "/" + this.settings.files[i] + ".html",
                renderer: this.renderer

            }, this.metadata);
            renderObject.render();


        } catch (e) {
            console.log(e);
        }

    }
};
exports.HtmlWriter = HtmlWriter;