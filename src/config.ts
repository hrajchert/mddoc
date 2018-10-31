import {objOf, str, optional, bool, ParmenidesError} from 'parmenides';
import {getGeneratorManager, GeneratorSettings} from "./generator/GeneratorManager";
import { findup } from "./utils/ts-task-fs-utils/findup";
import { Task, UnknownError } from "@ts-task/task";
import { validateContract } from './utils/parmenides/validate-contract';
import { renderError } from './utils/explain';
const _ = require('underscore');

const GeneratorManager = getGeneratorManager();

const settingsContract = objOf({
    inputDir: str,
    outputDir: optional(str),
    basePath: str,
    verbose: bool,
    inputExclude: optional(str)
});

interface GeneratorOptions {
    generatorType?: string;
}
export class Settings {
    /**
     * Path to the folder that has the Markdown files
     * TODO: Remove optional
     */
    inputDir?: string;

    /**
     * Path to the folder that will hold the output of this program
     * TODO: Remove optional
     */
    outputDir?: string;

    /**
     * A list of generators that indicate how the program should be "printed"
     */
    generators:{[name: string]: GeneratorSettings} = {};

    /**
     * Wether we should be verbose on output or not
     */
    verbose = false;

    inputExclude?: string;
    /**
     * The base path of the project
     */
    basePath = process.cwd();
    initConfig (config: unknown) {
        this.extend(config);
    };

    extend (config: unknown) {
        _.extend(this, config);
    };


    addGenerator (name: string, options: GeneratorOptions) {
        let generatorType = name;
        // By default, the generator type is the name, but you can override it in the options
        // In case you want to have two instances of the same generator
        if (typeof options.generatorType === 'string') {
            generatorType = options.generatorType;
        }
        var generatorFactory = GeneratorManager.findGeneratorFactory(generatorType, this.basePath);

        this.generators[name] = generatorFactory.createSettings(options, this);

        return this.generators[name];
    };
}


export class ErrorLoadingConfig {
    type = "ErrorLoadingConfig";
    constructor (private error: string | UnknownError | ParmenidesError) {
    }

    explain () {
        let ans = `There was a problem loading the settings: `;
        const error = this.error;
        if (typeof error === 'string') {
            ans += error;
        } else if (error instanceof ParmenidesError) {
            ans += error.getMessage();
        } else {
            ans += '\n' + renderError(error);
        }
        return ans;
    }
}

export function loadConfig (path: string, runOptions: unknown) {
    const config = new Settings();
    return findup(path, "Mddocfile.js")
        // TODO: candidate to mapError
        .catch(_ => Task.reject("Could not find Mddocfile.js"))
        .map(dir => {
            require(dir + "/Mddocfile.js")(config);

            if (runOptions) {
                config.extend(runOptions);
            }

            return config;
        })
        .chain(validateContract(settingsContract))
        // TODO: candidate to mapError
        .catch(err => Task.reject(new ErrorLoadingConfig(err)))
}
