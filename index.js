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

    var _metadataManager = null;

    var _mdReader = null;

    var _codeReader = null;

    var _codeIncluder = null;

    var _outputGenerator = null;

    var _verbose = true;

    exports.verbose = function(v) {
        _verbose = v;
    };

    exports.initialize = function (settings) {
        _settings = settings;

        // Initialize the metadata
        _metadataManager = new MetadataManager(settings);
        _metadataManager.initialize();

        // TODO: Avoid ASAP
        var metadata = _metadataManager.getPlainMetadata();

        // Add verbosity to the settings, dont quite like it to have it here :S
        settings.verbose = _verbose;

        // Metadata
        _mdReader = new MarkdownReader(settings);
        _codeReader = new CodeReader(metadata, settings);

        // TODO: mhmhmhm
        _metadataManager.renameThisMethod(_mdReader, _codeReader);

        // Tool
        _codeIncluder = new CodeIncluder(metadata);
        _outputGenerator = new Generator(metadata, settings);
    };

    exports.getMetadataManager = function () {
        return _metadataManager;
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
        return _mdReader.parse().otherwise(function(mdErr){
            console.log("Could not parse the markdown".red);
            if (mdErr.reader) {
                console.log("in file " + mdErr.reader.completeFileName.grey);
            }

            return when.reject(normalizeError("markdown parser", mdErr));
        });
    };

    // TODO: Eventually call this read references, as it should read all sort of documents, not just code
    exports.readCode = function () {
        return _codeReader.read().otherwise(function(err) {
            console.log("Could not read the code".red);
            if (err.reader) {
                console.log("in file " + err.reader.src.grey);
            }

            return when.reject(normalizeError("code reader", err));
        });
    };

    exports.saveMetadata = function () {
        return _metadataManager.save().otherwise(function(err) {
            console.log("Could not write the metadata".red);
            console.log(err);
            return when.reject(normalizeError("save metadata", err));
        });
    };

    exports.replaceReferences = function() {
        try {
            _codeIncluder.include();
            return when.resolve();
        } catch (e) {
            return when.reject(normalizeError("code includer", e));
        }

    };

    exports.generateOutput = function() {
        return _outputGenerator.generate().otherwise(function(err) {
            console.log("Could not generate the HTML".red);
            console.log(err);
            return when.reject(normalizeError("Output Generator", err));
        });

    };


    exports.run = function (steps) {
        return sequence(steps).then(function(){
            // I dont like this, quite much
            return _metadataManager.getPlainMetadata();
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
    exports.config          = require("./src/config");
})();
