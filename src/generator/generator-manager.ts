import { Task, UnknownError } from '@ts-task/task';
import { BaseGeneratorSettings, Settings } from '../config';
import { Metadata } from '../metadata-manager';

import * as path from 'path';
import { sequence } from '../utils/ts-task-utils/sequence';

import { Contract } from 'parmenides';
import * as GeneratorHelperManager from './generator-helper-manager';

interface Generator {
    generate: (helpers?: unknown) => Task<void, UnknownError>;
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

export function registerGenerator (name: string, genpath: string) {
    const factory: GeneratorFactory = require (genpath).default;

    if (!factory.hasOwnProperty('createGenerator')) {
        throw new Error('Module ' + genpath + ' doesn\'t have a constructor exported');
    }


    registeredGenerators[name] = factory;

    return factory;
}


/**
 * Make the path absolute. If it was relative, make it from the project base path
 */
function normalizeProjectGeneratorPath (genpath: string, basePath: string) {
    let ans = path.normalize(genpath);
    if (ans[0] !== '/') {
        ans = path.join(basePath, ans);
    }
    return ans;
}


export class GeneratorManager {
    generators: Array<{
        generatorObject: Generator;
        generatorSettings: BaseGeneratorSettings;
        generatorName: string;
    }> = [];

    metadata: Metadata | null = null;
    initialized = false;

    findGeneratorFactory (generatorType: string, basePath: string) {
        let generator,
            genpath;
        // TODO: This should return a task with a possible failure
        // If its already registered, cool
        if (registeredGenerators.hasOwnProperty(generatorType)) {
            generator = registeredGenerators[generatorType];
        }
        // If not, try to see if there is a npm dependency with that name
        else {
            genpath = normalizeProjectGeneratorPath('./node_modules/' + generatorType, basePath );
            try {
                generator = registerGenerator(generatorType, genpath);
            } catch (err) {
                if (err.message.indexOf(genpath) !== -1) {
                    throw new Error('Generator ' + generatorType + ' not defined');
                } else {
                    throw err;
                }
            }
        }
        return generator;
    }

    initialize (metadata: Metadata, projectSettings: Settings) {
        // Avoid duplicate initialization
        // WARNING: ref in markdown
        if (this.initialized) {
            return;
        }
        this.initialized = true;

        this.metadata = metadata;
        // Instantiate all generators
        for (const generatorName in projectSettings.generators) {
            // Get the generator settings (Ref in code)
            const generatorSettings = projectSettings.generators[generatorName];

            // Find the constructor
            const generatorFactory = this.findGeneratorFactory (generatorSettings.generatorType, projectSettings.basePath);

            // Instantiate it
            const generatorObject = generatorFactory.createGenerator(metadata, projectSettings, generatorSettings);

            // Add it to the generator instance list
            this.generators.push({
                generatorObject,
                generatorSettings,
                generatorName
            });
        }
        // Sort them by priority
        this.generators.sort(function (a, b) {
            return b.generatorSettings.priority - a.generatorSettings.priority;
        });


    }

    generate () {
        const self = this;
        const steps = self.generators.map(generator => () => {
            if (self.metadata === null) throw 'metadata shouldnt be null';
            const helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
            console.log('Executing the generator: ' + generator.generatorName);
            return generator.generatorObject.generate(helpers);
        });
        return sequence(steps);
    }

}

const singleton = new GeneratorManager();
export function getGeneratorManager () {
    return singleton;
}


registerGenerator('custom', './custom/CustomGenerator');
registerGenerator('html-fragment', './html-fragment/HtmlFragmentGenerator');

