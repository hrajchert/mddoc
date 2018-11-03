import { str, optional, bool, ParmenidesError, num, objOf} from 'parmenides';
import {  getGeneratorManager } from "./generator/GeneratorManager";
import { findup } from "./utils/ts-task-fs-utils/findup";
import { Task, UnknownError } from "@ts-task/task";
import { validateContract } from './utils/parmenides/validate-contract';
import { renderError } from './utils/explain';
import { dictionaryOf, Dictionary } from './utils/parmenides/dictionary';
import { ContractOf } from './utils/parmenides/contract-of';
import { objMap } from './utils/obj-map';
import { traverseDictionary } from './utils/ts-task-utils/traverse-dictionary';

const settingsContract = objOf({
    inputDir: str,
    outputDir: str,
    basePath: str,
    verbose: bool,
    inputExclude: optional(str),
    generators: dictionaryOf(
        objOf({
            generatorType: str,
            priority: num,
            outputDir: str
        })
    )
});

export interface BaseGeneratorSettings {
    generatorType: string;
    priority: number;
    outputDir: string;
}

export interface Settings {
    /**
     * Path to the folder that has the Markdown files
     */
    inputDir: string;

    /**
     * Path to the folder that will hold the output of this program
     */
    outputDir: string;

    /**
     * A list of generators that indicate how the program should be "printed"
     */
    generators: Dictionary<BaseGeneratorSettings>;

    /**
     * Wether we should be verbose on output or not
     */
    verbose: boolean;

    /**
     * TODO: what was this for?
     */
    inputExclude?: string;

    /**
     * The base path of the project
     */
    // basePath = process.cwd();
    basePath: string;


}


function requireConfigFile (dir: string) {
    return new Task<unknown, string>((resolve, reject) => {
        try {
            resolve(require(dir + "/Mddocfile.js")());
        } catch (err) {
            reject('Could not require the config file');
        }
    });
}

const loadedSettingsContract = objOf({
    inputDir: str,
    outputDir: str,
    basePath: optional(str),
    verbose: optional(bool),
    inputExclude: optional(str),
    generators: optional(
        dictionaryOf(
            objOf({
                generatorType: optional(str),
                priority: optional(num),
                outputDir: optional(str)
            })
        )
    )
});

function readAndValidateConfigFile (path: string) {
    // Find the closest config file
    return findup(path, "Mddocfile.js")
        // If we cannot find it, transform the error to a message
        .catch(_ => Task.reject("Could not find Mddocfile.js")) // TODO: candidate to mapError
        // Load the file
        .chain(requireConfigFile)
        // Validate it has the minumu required settings
        // and if other values are provided, they have the correct type
        .chain(validateContract(loadedSettingsContract));
}



class GeneratorConfigError {
    constructor (public name: string, public err: ParmenidesError) {

    }
    explain () {
        return `Invalid configuration for generator type "${this.name}": ${this.err.getMessage()}`
    }
}

function validateGenerators(config: ContractOf<typeof loadedSettingsContract>)  {
    const basePath = config.basePath || process.cwd();
    const generators = config.generators || {};

    // const basePath = config.basePath
    const tasks = objMap(generators, (generator, genName) => {
        // By default, the generator type is the name, but you can override it in the options
        // In case you want to have two instances of the same generator
        const generatorType = generator.generatorType || genName;
        const priority = generator.priority || 100;
        const generatorFactory = getGeneratorManager().findGeneratorFactory(generatorType, basePath);
        return validateContract(generatorFactory.contract)({
            ...generator,
            priority,
            generatorType
        }).catch(err => Task.reject(new GeneratorConfigError(genName, err))); // TODO: mapError
    });
    return traverseDictionary(tasks)
        .map(generators => ({
            ...config,
            basePath,
            generators
        }));
}



type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

type Overrides = Omit<Partial<Settings>, 'generators'>

export function loadConfig (path: string, overrides: Overrides) {
    // Find the closest config file
    return readAndValidateConfigFile(path)
        // Override the config using the overrides
        .map(config => ({
            ...config,
            ...overrides
        }))
        // Valiedate each validator with it's custom settings contract
        .chain(validateGenerators)
        // Make sure that all values are set
        .chain(validateContract(settingsContract))
        // If anything goes wrong, wrap it in an ErrorLoadingConfig object
        .catch(err => Task.reject(new ErrorLoadingConfig(err))) // TODO: candidate to mapError
}

export class ErrorLoadingConfig {
    type = "ErrorLoadingConfig";
    constructor (private error: string | UnknownError | ParmenidesError | GeneratorConfigError) {
    }

    explain () {
        let ans = `There was a problem loading the settings: `;
        const error = this.error;
        if (typeof error === 'string') {
            ans += error;
        } else if (error instanceof ParmenidesError) {
            ans += error.getMessage();
        } else if (error instanceof GeneratorConfigError) {
            ans += error.explain()
        } else {
            ans += '\n' + renderError(error);
        }
        return ans;
    }
}