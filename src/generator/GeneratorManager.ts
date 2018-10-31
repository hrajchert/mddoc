import { Settings } from "../config";
import { Metadata } from "../MetadataManager";
import { BaseGeneratorSettings, BaseGeneratorSettingsOptions } from "./BaseGeneratorSettings";
import { Task, UnknownError } from "@ts-task/task";

/** @module GeneratorManager */
import * as path from 'path';
import { sequence } from "../utils/ts-task-utils/sequence";

var GeneratorHelperManager = require("./GeneratorHelperManager");

interface Generator {
    generate: (helpers?: unknown) => Task<void, UnknownError>
}

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
    var factory: GeneratorFactory = require (genpath).default;

    if (!factory.hasOwnProperty("createGenerator")) {
        throw new Error("Module " + genpath + " doesn't have a constructor exported");
    }

    if (!factory.hasOwnProperty("createSettings")) {
        factory.createSettings = function (options: BaseGeneratorSettingsOptions, globalSettings: Settings) {
            var settings = new BaseGeneratorSettings(options, globalSettings);
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

export interface GeneratorSettings {
    priority: number;
    getGeneratorType: () => string;
}


export class GeneratorManager {
    generators: Array<{
        generatorObject: Generator;
        generatorSettings: GeneratorSettings;
        generatorName: string;
    }> = [];

    metadata: Metadata | null = null;
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

    initialize (metadata: Metadata, projectSettings: Settings) {
        // Avoid duplicate initialization
        // !!!!!!!!!!!!!!!!!!!!!!
        // TODO: IMPORTANT ref
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        this.metadata = metadata;
        // Instantiate all generators
        for (let generatorName in projectSettings.generators) {
            // Get the generator settings
            // !!!!!!!!!!!!!!!!!!!!!!
            // TODO: IMPORTANT ref
            const generatorSettings = projectSettings.generators[generatorName];

            // Find the constructor
            const generatorFactory = this.findGeneratorFactory (generatorSettings.getGeneratorType(), projectSettings.basePath);

            // Instantiate it
            // !!!!!!!!!!!!!!!!!!!!!!
            // TODO: IMPORTANT ref
            const generatorObject = generatorFactory.createGenerator(metadata, projectSettings, generatorSettings);

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
        const steps = self.generators.map(generator => () => {
            const helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
            console.log("Executing the generator: " + generator.generatorName);
            return generator.generatorObject.generate(helpers);
        })
        return sequence(steps);
    };

}

const singleton = new GeneratorManager();
export function getGeneratorManager () {
    return singleton;
}


registerGenerator("custom", "./custom/CustomGenerator");
registerGenerator("html-fragment", "./html-fragment/HtmlFragmentGenerator");

