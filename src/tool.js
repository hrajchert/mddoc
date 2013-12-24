var MarkdownReader = require("./MarkdownReader").MarkdownReader;
var CodeReader = require("./CodeReader").CodeReader;
var CodeIncluder = require("./CodeIncluder").CodeIncluder;
var MetadataManager = require("./MetadataManager").MetadataManager;
var Generator = require("./generator/Generator").Generator;
var when = require("when");
var sequence = require("when/sequence");
require("colors");


var verbose = true;

exports.verbose = function(v) {
    verbose = v;
};


exports.run = function(settings) {
    // Initialize the metadata
    var metadataManager = new MetadataManager(settings);
    metadataManager.initialize();

    // TODO: Avoid ASAP
    var metadata = metadataManager.getPlainMetadata();

    // Add verbosity to the settings, dont quite like it to have it here :S
    settings.verbose = verbose;

    // Metadata
    var mdReader = new MarkdownReader(settings);
    var codeReader = new CodeReader(metadata, settings);

    // TODO: mhmhmhm
    metadataManager.renameThisMethod(mdReader, codeReader);


    // Tool
    var codeIncluder = new CodeIncluder(metadata);
    var outputGenerator = new Generator(metadata, settings);


    function normalizeError(step, error) {
        var errorObject = {step: step};
        if (error instanceof Error) {
            errorObject.err = {msg: error.message, stack: error.stack};
        } else {
            errorObject.err = error;
        }
        return errorObject;
    }
    function mdReaderParse () {
        return mdReader.parse().otherwise(function(mdErr){
            console.log("Could not parse the markdown".red);
            console.log(mdErr.err);
            return when.reject(normalizeError("markdown parser", mdErr));
        });
    }

    function codeReaderRead () {
        return codeReader.read().otherwise(function(err) {
            console.log("Could not read the code".red);
            console.log(err);
            return when.reject(normalizeError("code reader", err));
        });
    }

    function writeMetadata () {
        // TODO: This is obviously going to be at another location
        try {
            metadataManager.save();
            return when.resolve();
        } catch (e) {
            return when.reject(normalizeError("write metadata", e));
        }
    }

    function codeIncluderInclude() {
        try {
            codeIncluder.include();
            return when.resolve();
        } catch (e) {
            return when.reject(normalizeError("code includer", e));
        }

    }

    function outputGenerate() {
        try {
            outputGenerator.generate();
            return when.resolve();
        } catch (e) {
            return when.reject(normalizeError("Output Generator", e));
        }
    }

    var steps = [
        mdReaderParse,
        codeReaderRead,
        writeMetadata,
        codeIncluderInclude,
        outputGenerate
    ];

    return sequence(steps).then(function(){
        return metadata;
    });
};
