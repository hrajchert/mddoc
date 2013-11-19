var MarkdownReader = require("./MarkdownReader").MarkdownReader;
var CodeReader = require("./CodeReader").CodeReader;
var CodeIncluder = require("./CodeIncluder").CodeIncluder;
var HtmlWriter = require("./HtmlWriter").HtmlWriter;
var    fs = require("fs");
var _ = require("underscore");
var colors = require("colors");





exports.run = function(settings) {
    debugger;
    // Initialize the empty metadata
    var metadata = {};

    // Metadata
    var mdReader = new MarkdownReader(metadata, settings);
    var codeReader = new CodeReader(metadata, settings);

    // Tool
    var codeIncluder = new CodeIncluder(metadata);
    var htmlWriter = new HtmlWriter(metadata, settings);

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



    codeIncludePromise.then(function(){
        return htmlWriter.generate();
    });



};
