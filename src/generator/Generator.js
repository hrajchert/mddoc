(function() {
    var _ = require("underscore");

    var registeredGenerators = {};

    var Generator = function (metadata, settings) {
        this.generators = [];
        if ("generators" in settings) {
            for (var generatorType in settings.generators) {
                if (!registeredGenerators.hasOwnProperty(generatorType)) {
                    throw new Error("Generator " + generatorType + " not defined");
                }
                this.generators[generatorType] = registeredGenerators[generatorType].call(this, metadata, settings);
            }
        }
    };

    Generator.prototype.generate = function () {
        for (var generatorType in this.generators) {
            this.generators[generatorType].generate();
        }
    }

    var registerGenerator = function (name, gen) {
        if (_.isFunction(gen)) {
            _registerGeneratorByConstructor(name, gen);
        } else if (_.isString(gen)) {
            _registerGeneratorByPath(name, gen);
        } else {
            throw new Error("Invalid generator type supplied");
        }
    }

    var _registerGeneratorByConstructor = function (name, f) {
        registeredGenerators[name] = f;
    }
    var _registerGeneratorByPath = function (name, path) {
        var module = require (path);

        if ("constructor" in module) {
            _registerGeneratorByConstructor(name, module.constructor);
        } else {
            throw new Error("Module " + path + " doesn't have a constructor exported");
        }
    }

    registerGenerator("custom", "./custom/CustomGenerator");

    exports.Generator = Generator;
})();
