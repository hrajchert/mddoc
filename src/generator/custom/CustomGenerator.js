var fs = require("fs");
var utils = require("../../utils");
var walkDir = utils.walkDir;


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
    var html = this.renderer.render(this.inputFile, {documentor: this.metadata.jsonml});
    fs.writeFile(this.outputFile, html , this.fileRendered.bind(this));
};




var markdown = require("markdown").markdown;

function addRenderHelpers (metadata) {
    metadata.jsonml.getHtml = function(mdTemplate) {
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
}

var HtmlWriter = function (metadata, settings) {
    this.metadata = metadata;
    this.settings = settings.generators.custom;
    // TODO: this should be in the HtmlWriterFile, but i dont want to create
    // one every time
    var ECT = require("ect");
    this.renderer = ECT({ root : this.settings.templateDir });

};

// TODO: Refactor into utils copy -R
HtmlWriter.prototype.copyAssets = function () {
    var inputDir = this.settings.templateDir,
        outputDir = this.settings.outputDir;
    return walkDir(inputDir).then(function(files) {
        var mdre = /\/(css|js|images|fonts)\//;

        // Precalculate the lenght of the name of the input dir
        var dirNameLength = inputDir.length;

        for (var i = 0; i<files.length;i++) {
            var m = files[i].match(mdre);
            if (m) {
                debugger;
                var copyOptions = {
                    inputFilename: files[i],
                    outputFilename: outputDir + "/" + files[i].substr(dirNameLength+1)
                }
                console.log(copyOptions.inputFilename.grey + " => ".green + copyOptions.outputFilename.grey);

                // Copy the file
                fs.readFile(copyOptions.inputFilename, "utf8", function(err, f) {
                    if (err) {
                        console.error("There was a problem opening the file ", err );
                    }
                    utils.writeFileCreateDir(this.outputFilename, f).otherwise(function(err) {
                        console.error("There was a problem writing the file", err);
                    });
                }.bind(copyOptions));
            }
        }
    });
}

HtmlWriter.prototype.generate = function(){
    if (this.settings.copyAssets) {
        this.copyAssets();
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
    return new HtmlWriter(metadata, settings);
}
