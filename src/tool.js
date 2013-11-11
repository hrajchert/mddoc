var markdown = require("markdown").markdown;
var parseMd = require("./markdown_reader").parseMd;
var    fs = require("fs");
var _ = require("underscore");






exports.run = function(settings) {
    var ECT = require("ect");
    var renderer = ECT({ root : settings.inputDir });

    var parseMdPromise = parseMd(settings);

    function renderedFileWroteHandler(err) {
        if (err) {
            throw err;
        }
        console.log("We wrote " + this.outputFile);
    }

    function getHtml() {
        return renderer.render(this.inputFile, this.data);
    }

    parseMdPromise.then(function(mds){
        console.log("The input is parsed");
        mds.getHtml = function(mdTemplate) {
            var tree;
            if (!mds.hasOwnProperty(mdTemplate)) {
                throw "We Couldnt find a md template with the name " + mdTemplate;
            }
            try {
                tree = markdown.toHTMLTree(mds[mdTemplate]);
            }catch (e) {
                console.log(e);
                throw "Couldnt create html for template " + mdTemplate;
            }

            return markdown.renderJsonML(tree);
        };

        var data = { documentor : mds };

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
                             _.bind(renderedFileWroteHandler,renderObject));

            } catch (e) {
                console.log(e);
            }

        }
    });

    parseMdPromise.otherwise(function(err){
        console.log("Could not parse the markdown's");
        console.log(err);
    });
};
