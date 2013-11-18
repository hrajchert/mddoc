var markdown = require("markdown").markdown;
var MarkdownReader = require("./MarkdownReader").MarkdownReader;
var CodeReader = require("./CodeReader").CodeReader;
var CodeIncluder = require("./CodeIncluder").CodeIncluder;
var    fs = require("fs");
var _ = require("underscore");
var colors = require("colors");





exports.run = function(settings) {
    var ECT = require("ect");
    var renderer = ECT({ root : settings.inputDir });
    debugger;
    // Initialize the empty metadata
    var metadata = {};

    // Metadata
    var mdReader = new MarkdownReader(metadata, settings);
    var codeReader = new CodeReader(metadata, settings);

    // Tool
    var codeIncluder = new CodeIncluder(metadata);

    var parseMdPromise = mdReader.parse();
    parseMdPromise.otherwise(function(mdErr){
        console.log("Could not parse the markdown: ".red + mdErr.reader.completeFileName);
        console.log(mdErr.err);
    });

    var readCodePromise = parseMdPromise.then(function(){
        return codeReader.read();
    });
    readCodePromise.otherwise(function(err) {
        console.log("Could not read the code".red);
        console.log(err);
    });
    // TODO: This is obviously going to be at another location
    readCodePromise.then(function(){
        // Write down the metadata
        var metadataFileName = settings.outputDir + "/metadata.json";
        var metadataStr = JSON.stringify(metadata, null, "    ");
        fs.writeFile(metadataFileName, metadataStr, function(err){
            if (err) {
                console.log("There was a problem writing the metadata".red + err);
            }
            console.log("Metadata written to ".green + metadataFileName.grey);
        });
    });

    var codeIncludePromise = readCodePromise.then(function(){
        return codeIncluder.include();
    });


    codeIncludePromise.otherwise(function(err) {
        console.log("Could not include code".red);
        console.log(err);
    });

    function renderedFileWroteHandler(err) {
        if (err) {
            throw err;
        }
        console.log("We wrote ".green + this.outputFile.grey);
    }

    function getHtml() {
        return renderer.render(this.inputFile, this.data);
    }


    codeIncludePromise.then(function(){
        console.log("The input is parsed".cyan);
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



};
