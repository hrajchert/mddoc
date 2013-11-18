var markdown = require("markdown").markdown;
var MarkdownReader = require("./markdown_reader").MarkdownReader;
var CodeReader = require("./CodeReader").CodeReader;
var    fs = require("fs");
var _ = require("underscore");
var colors = require("colors");





exports.run = function(settings) {
    var ECT = require("ect");
    var renderer = ECT({ root : settings.inputDir });
    debugger;
    // Initialize the empty metadata
    var metadata = {};

    var mdReader = new MarkdownReader(metadata, settings);
    var codeReader = new CodeReader(metadata, settings);

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

    function renderedFileWroteHandler(err) {
        if (err) {
            throw err;
        }
        console.log("We wrote ".green + this.outputFile.grey);
    }

    function getHtml() {
        return renderer.render(this.inputFile, this.data);
    }


    readCodePromise.then(function(){
        // Replace the code, clearly not going to be here.
        var mdFile, refs, ref, snippet ;
        debugger;
        for (mdFile in metadata.hrMd) {
            refs = metadata.hrMd[mdFile].refs;
            for (var i = 0; i < refs.length ; i++) {
                ref = refs[i];
                if (ref.found && ref.type === "include") {
                    // TODO: add an includer / formatter
                    snippet = metadata.hrCode[ref.src].refs[ref.refhash].snippet;
                    ref.jsonml[0] = "code_block";
                    ref.jsonml[1] = snippet;
                }
            }

        }

    }).then(function(){
        debugger;
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

    // TODO: This is obviously going to be at another location
    readCodePromise.then(function(){
        // Write down the metadata
        var metadataFileName = settings.outputDir + "/metadata.json";
        var metadataStr = JSON.stringify(metadata, null, "\t");
        fs.writeFile(metadataFileName, metadataStr, function(err){
            if (err) {
                console.log("There was a problem writing the metadata".red + err);
            }
            console.log("Metadata written to ".green + metadataFileName.grey);
        });
    });


};
