import { Settings } from "../config";

/** @module GeneratorManager */
var
    when     = require("when"),
    path     = require("path");

var GeneratorHelperManager = require("./GeneratorHelperManager");

var PluginResolver = require("../PluginResolver");


interface GeneratorFactory {
    /**
     * Method to create a Generator
     */
    createGenerator: Function;

    /**
     * Method to create the settings of a Generator from a object literal
     */
    createSettings: Function;
}

/**
 * Available generators
 */
const registeredGenerators: {[name: string]: GeneratorFactory} = {};

export function registerGenerator (name:string, genpath: string) {
    var factory = require (genpath)(PluginResolver);

    if (!factory.hasOwnProperty("createGenerator")) {
        throw new Error("Module " + path + " doesn't have a constructor exported");
    }

    if (!factory.hasOwnProperty("createSettings")) {
        factory.createSettings = function (options: any, globalSettings: any) {
            var settings = new PluginResolver.BaseGeneratorSettings(options, globalSettings);
            // Add the generator type to the default settings
            settings.generatorType = name;
            return settings;
        };
    }

    registeredGenerators[name] = factory;

    return factory;
}



/**
 * Make the path absolute. If it was relative, make it from the project base path
 */
function normalizeProjectGeneratorPath (genpath: string, basePath: string) {
    genpath = path.normalize(genpath);
    if (genpath[0] !== "/") {
        genpath = path.join(basePath, genpath);
    }
    return genpath;
};



export class GeneratorManager {
    generators: Array<{
        generatorObject: any;
        generatorSettings: any;
        generatorName: string;
    }> = [];

    metadata = null;
    initialized = false;

    /**
     * @returns {GeneratorFactory}
     */
    findGeneratorFactory (generatorType: string, basePath: string) {
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

    initialize (metadata: any, projectSettings: Settings) {
        // Avoid duplicate initialization
        // !!!!!!!!!!!!!!!!!!!!!!
        // TODO: IMPORTANT ref
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        this.metadata = metadata;
        // Instantiate all generators
        for (var generatorName in projectSettings.generators) {
            // Get the generator settings
            // !!!!!!!!!!!!!!!!!!!!!!
            // TODO: IMPORTANT ref
            var generatorSettings = projectSettings.generators[generatorName];

            // Find the constructor
            var generatorFactory = this.findGeneratorFactory (generatorSettings.getGeneratorType(), projectSettings.basePath);

            // Instantiate it
            // !!!!!!!!!!!!!!!!!!!!!!
            // TODO: IMPORTANT ref
            var generatorObject = generatorFactory.createGenerator(metadata, projectSettings, generatorSettings);

            // Add it to the generator instance list
            this.generators.push({
                generatorObject,
                generatorSettings,
                generatorName
            });
        }
        // Sort them by priority
        this.generators.sort(function(a, b) {
            return b.generatorSettings.priority - a.generatorSettings.priority;
        });


    };

    generate () {
        var self = this;
        return when.promise(function(resolve: any, reject: any) {
            var helpers;

            var iterate = function (i: number) {
                if (i < self.generators.length) {
                    helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
                    console.log("Executing the generator: " + self.generators[i].generatorName);
                    // If we have more generators, call them in sequence
                    when(self.generators[i].generatorObject.generate(helpers)).then(
                        function() {
                            iterate(i+1);
                        },
                        function(err: any) {
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

}

const singleton = new GeneratorManager();
export function getGeneratorManager () {
    return singleton;
}


registerGenerator("custom", "./custom/CustomGenerator");
registerGenerator("html-fragment", "./html-fragment/HtmlFragmentGenerator");

