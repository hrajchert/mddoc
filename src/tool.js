var markdown = require("markdown").markdown;
var MarkdownReader = require("./markdown_reader").MarkdownReader;
var    fs = require("fs");
var _ = require("underscore");






exports.run = function(settings) {
    var ECT = require("ect");
    var renderer = ECT({ root : settings.inputDir });

    // Initialize the empty metadata
    var metadata = {};

    var mdReader = new MarkdownReader(metadata, settings);

    var parseMdPromise = mdReader.parse();

    function renderedFileWroteHandler(err) {
        if (err) {
            throw err;
        }
        console.log("We wrote " + this.outputFile);
    }

    function getHtml() {
        return renderer.render(this.inputFile, this.data);
    }


    parseMdPromise.then(function(){
        debugger;
        console.log("The input is parsed");
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

        var data = { documentor : metadata.jsonml };

        for (var i=0; i<settings.files.length; i++) {
            try {
                var renderObject = {
                    inputFile: settings.files[i] + ".ect",
                    outputFile: settings.outputDir + "/" + settings.files[i] + ".html",
                    getHtml: getHtml,
                    data: data
                };


                fs.writeFile(renderObject.outputFile,
                             renderObject.getHtml(),
                             renderedFileWroteHandler.bind(renderObject));

            } catch (e) {
                console.log(e);
            }

        }
    });

    parseMdPromise.otherwise(function(mdErr){
        console.log("Could not parse the markdown: " + mdErr.reader.completeFileName);
        console.log(mdErr.err);
    });
};
