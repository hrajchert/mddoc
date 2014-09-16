/** @module GeneratorManager */
var
    when     = require("when"),
    path     = require("path");

var GeneratorHelperManager = require("./GeneratorHelperManager");

var PluginResolver = require("../PluginResolver");

/**
 * @typedef {Object}  GeneratorFactory
 * @property {Function} createGenerator           Method to create a Generator
 * @property {Function} createSettings   Method to create the settings of a Generator from a object literal
 */

/**
 * Available generators
 * @var {Object.<string, GeneratorFactory>}
 */
var registeredGenerators = {};

var registerGenerator = function (name, genpath) {
    var factory = require (genpath)(PluginResolver);

    if (!factory.hasOwnProperty("createGenerator")) {
        throw new Error("Module " + path + " doesn't have a constructor exported");
    }

    if (!factory.hasOwnProperty("createSettings")) {
        factory.createSettings = function(options, globalSettings) {
            return new PluginResolver.BaseGeneratorSettings(options, globalSettings);
        };
    }

    registeredGenerators[name] = factory;

    return factory;
};



/**
 * Make the path absolute. If it was relative, make it from the project base path
 */
var normalizeProjectGeneratorPath = function (genpath, basePath) {
    genpath = path.normalize(genpath);
    if (genpath[0] !== "/") {
        genpath = path.join(basePath, genpath);
    }
    return genpath;
};




/**
 * @class
 */
var GeneratorManager = function () {
    this.generators = [];
    this.metadata = null;
};

/**
 * @returns {GeneratorFactory}
 */
GeneratorManager.prototype.findGeneratorFactory = function (generatorType, basePath) {
    var generator,
        genpath;

    // If its already registered, cool
    if (registeredGenerators.hasOwnProperty(generatorType)) {
        generator = registeredGenerators[generatorType];

    }
    // If not, try to see if there is a npm dependency with that name
    else {
        genpath = normalizeProjectGeneratorPath("./node_modules/" + generatorType, basePath );
        try {
            generator = registerGenerator(generatorType, genpath);
        } catch(err) {
            if (err.message.indexOf(genpath) !== -1) {
                throw new Error("Generator " + generatorType + " not defined");
            } else {
                throw err;
            }
        }
    }
    return generator;
};

GeneratorManager.prototype.initialize = function (metadata, settings) {
    this.metadata = metadata;
    if ("generators" in settings) {
        // Instantiate all generators
        for (var generatorType in settings.generators) {

            var generatorSettings = settings.generators[generatorType];
            // Get the generator factory
            var generatorFactory = this.findGeneratorFactory (generatorType, settings.basePath);
            // Initialize it
            this.generators.push({
                generatorObject: generatorFactory.createGenerator(metadata, settings),
                generatorSettings: generatorSettings,
                generatorType: generatorType
            });
        }
        // Sort them by priority
        this.generators.sort(function(a,b) {
            return a.generatorSettings.priority < b.generatorSettings.priority;
        });

    }

};

GeneratorManager.prototype.generate = function () {
    var self = this;
    return when.promise(function(resolve, reject) {
        var helpers;

        var iterate = function (i) {
            if (i < self.generators.length) {
                helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
                console.log("Executing " + self.generators[i].generatorType + " generator");
                // If we have more generators, call them in sequence
                when(self.generators[i].generatorObject.generate(helpers)).then(
                    function() {
                        iterate(i+1);
                    },
                    function(err) {
                        reject(err);
                    }
                );
            } else {
                // If there are no more generators, we are done
                resolve();
            }

        };
        iterate(0);
    });
};

registerGenerator("custom", "./custom/CustomGenerator");
registerGenerator("html-fragment", "./html-fragment/HtmlFragmentGenerator");

/* @exports */
exports.GeneratorManager = new GeneratorManager();
exports.registerGenerator = registerGenerator;
