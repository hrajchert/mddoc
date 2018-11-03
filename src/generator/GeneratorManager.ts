import { Settings, BaseGeneratorSettings } from "../config";
import { Metadata } from "../MetadataManager";
import { Task, UnknownError } from "@ts-task/task";

import * as path from 'path';
import { sequence } from "../utils/ts-task-utils/sequence";

import * as GeneratorHelperManager from "./GeneratorHelperManager";
import { Contract } from "parmenides";

interface Generator {
    generate: (helpers?: unknown) => Task<void, UnknownError>
}

interface GeneratorFactory {
    /**
     * Method to create a Generator
     */
    createGenerator: Function;

    /**
     * Contract to see if the generator settings are the correct ones
     */
    contract: Contract<BaseGeneratorSettings>;
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
        generatorObject: Generator;
        generatorSettings: BaseGeneratorSettings;
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
        // TODO: This should return a task with a possible failure
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
            const generatorFactory = this.findGeneratorFactory (generatorSettings.generatorType, projectSettings.basePath);

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
            if (self.metadata === null) throw 'metadata shouldnt be null';
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

