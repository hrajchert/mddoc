(function(){
    "use strict";

    var MarkdownReader = require("./src/MarkdownReader").MarkdownReader,
        CodeReader = require("./src/CodeReader").CodeReader,
        CodeIncluder = require("./src/CodeIncluder").CodeIncluder,
        MetadataManager = require("./src/MetadataManager").MetadataManager,
        Generator = require("./src/generator/Generator").Generator;

    var when = require("when"),
        sequence = require("when/sequence");

    // Library shouldnt have colors

    require("colors");
    var _settings = null;

    var metadataManager = null;

    var mdReader = null;

    var codeReader = null;

    var codeIncluder = null;

    var outputGenerator = null;

    var _verbose = true;

    exports.verbose = function(v) {
        _verbose = v;
    };

    exports.initialize = function (settings) {
        _settings = settings;

        // Initialize the metadata
        metadataManager = new MetadataManager(settings);
        metadataManager.initialize();

        // TODO: Avoid ASAP
        var metadata = metadataManager.getPlainMetadata();

        // Add verbosity to the settings, dont quite like it to have it here :S
        settings.verbose = _verbose;

        // Metadata
        mdReader = new MarkdownReader(settings);
        codeReader = new CodeReader(metadata, settings);

        // TODO: mhmhmhm
        metadataManager.renameThisMethod(mdReader, codeReader);


        // Tool
        codeIncluder = new CodeIncluder(metadata);
        outputGenerator = new Generator(metadata, settings);
    };

    // ------------------------------
    // --     STEPS DEFINITION     --
    // ------------------------------

    function normalizeError(step, error) {
        var errorObject = {step: step};
        if (error instanceof Error) {
            errorObject.err = {msg: error.message, stack: error.stack};
        } else {
            errorObject.err = error;
        }
        return errorObject;
    }




    exports.readMarkdown = function () {
        return mdReader.parse().otherwise(function(mdErr){
            console.log("Could not parse the markdown".red);
            if (mdErr.reader) {
                console.log("in file " + mdErr.reader.completeFileName.grey);
            }

            return when.reject(normalizeError("markdown parser", mdErr));
        });
    };

    // TODO: Eventually call this read references, as it should read all sort of documents, not just code
    exports.readCode = function () {
        return codeReader.read().otherwise(function(err) {
            console.log("Could not read the code".red);
            if (err.reader) {
                console.log("in file " + err.reader.src.grey);
            }

            return when.reject(normalizeError("code reader", err));
        });
    };

    exports.saveMetadata = function () {
        return metadataManager.save().otherwise(function(err) {
            console.log("Could not write the metadata".red);
            console.log(err);
            return when.reject(normalizeError("save metadata", err));
        });
    };

    exports.replaceReferences = function() {
        try {
            codeIncluder.include();
            return when.resolve();
        } catch (e) {
            return when.reject(normalizeError("code includer", e));
        }

    };

    exports.generateOutput = function() {
        return outputGenerator.generate().otherwise(function(err) {
            console.log("Could not generate the HTML".red);
            console.log(err);
            return when.reject(normalizeError("Output Generator", err));
        });

    };


    exports.run = function (steps) {
        return sequence(steps).then(function(){
            // I dont like this, quite much
            return metadataManager.getPlainMetadata();
        });
    };


    // ------------------------------
    // --     OTHER INCLUDES       --
    // ------------------------------
    // TODO: check this
    exports.CodeIncluder    = CodeIncluder;
    exports.MarkdownReader  = MarkdownReader;
    exports.CodeReader      = CodeReader;
    exports.Generator       = Generator;
    exports.utils           = require("./src/utils");
})();
