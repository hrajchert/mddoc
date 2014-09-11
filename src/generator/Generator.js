(function() {
    var _        = require("underscore"),
        when     = require("when"),
        path     = require("path");

    // TODO: remove
    var utils = require("../utils");
    var GeneratorHelperManager = require("./GeneratorHelperManager");

    var registeredGenerators = {};


    var registerGenerator = function (name, gen) {
        var generator;
        if (_.isFunction(gen)) {
            generator = _registerGeneratorByConstructor(name, gen);
        } else if (_.isString(gen)) {
            generator = _registerGeneratorByPath(name, gen);
        } else {
            throw new Error("Invalid generator type supplied");
        }
        return generator;
    };

    var _registerGeneratorByConstructor = function (name, f) {
        registeredGenerators[name] = f;
        return f;
    };
    var _registerGeneratorByPath = function (name, genpath) {
        var module = require (genpath);

        if (!module.hasOwnProperty("constructor")) {
            throw new Error("Module " + path + " doesn't have a constructor exported");
        }
        return _registerGeneratorByConstructor(name, module.constructor);
    };

    var normalizeProjectGeneratorPath = function (genpath) {
        genpath = path.normalize(genpath);
        if (genpath[0] !== "/") {
            genpath = path.join(process.cwd(), genpath);
        }
        return genpath;
    };

    function findGenerator (generatorType, settings) {
        var generator,
            genpath;

        // If its already registered, cool
        if (registeredGenerators.hasOwnProperty(generatorType)) {
            generator = registeredGenerators[generatorType];

        }
        // If not, see if the configuration has a generator property
        else if (settings.generators[generatorType].hasOwnProperty("generator")) {
            genpath = normalizeProjectGeneratorPath(settings.generators[generatorType].generator);
            generator = registerGenerator(generatorType, genpath);
        }
        // If not, try to see if there is a npm dependency with that name
        else {
            genpath = normalizeProjectGeneratorPath("./node_modules/" + generatorType );
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
    }

    function normalizeGeneratorConfig (generatorSetting, globalSetting) {
        if (generatorSetting.hasOwnProperty("relativeOutputDir")) {
            generatorSetting.outputDir = globalSetting.outputDir + "/" + generatorSetting.relativeOutputDir;
        }
        // If it doesn't have relativeOutputDir nor outputDir, use the globalSetting outputDir
        else if (!generatorSetting.hasOwnProperty("outputDir")) {
            generatorSetting.outputDir = globalSetting.outputDir;
        }

        // If it doesn't have priority, give a default of 100
        if (!generatorSetting.hasOwnProperty("priority")) {
            generatorSetting.priority = 100;
        }
        // TODO: maybe normalize path, right?
        return generatorSetting;
    }

    var Generator = function (metadata, settings) {
        this.generators = [];
        this.metadata = metadata;
        if ("generators" in settings) {
            // Instantiate all generators
            for (var generatorType in settings.generators) {
                // Set configuration defaults TODO: revisit this, as you cannot avoid it for now
                var generatorSettings = normalizeGeneratorConfig(settings.generators[generatorType], settings);
                // Get the generator constructor
                var generatorConstructor = findGenerator (generatorType, settings);
                // Initialize it
                this.generators.push({
                    generatorObject: generatorConstructor.call(this, metadata, settings, utils),
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

    Generator.prototype.generate = function () {
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
//            console.log(self.generators);
//            var promises = [];
//            console.log(self.generators);
//            return resolve();
//            for (var generatorType in this.generators) {
//
//                promises.push(this.generators[generatorType].generate);
//            }
//            return sequence.apply(this, helpersArry);
        });
    };

    registerGenerator("custom", "./custom/CustomGenerator");
    registerGenerator("html-fragment", "./html-fragment/HtmlFragmentGenerator");

    exports.Generator = Generator;
})();
