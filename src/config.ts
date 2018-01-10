var _      = require("underscore"),
    findup = require("findup"),
    when   = require("when");

import {getGeneratorManager} from "./generator/GeneratorManager";

const GeneratorManager = getGeneratorManager();

export class Settings {
    /**
     * Path to the folder that has the Markdown files
     */
    inputDir: string;

    /**
     * Path to the folder that will hold the output of this program
     */
    outputDir?: string;

    /**
     * A list of generators that indicate how the program should be "printed"
     * @member {Array.<GeneratorConfig>}
     */
    generators:{[name: string]: GeneratorConfig} = {};

    /**
     * Wether we should be verbose on output or not
     */
    verbose = false;

    /**
     * The base path of the project
     */
    basePath = process.cwd();
    initConfig (config: any) {
        this.extend(config);
    };

    extend (config: any) {
        _.extend(this, config);
    };


    addGenerator (name: string, options: any) {
        var generatorType = name;
        // By default, the generator type is the name, but you can override it in the options
        // In case you want to have two instances of the same generator
        if (options.hasOwnProperty("generatorType")) {
            generatorType = options.generatorType;
        }
        var generatorFactory = GeneratorManager.findGeneratorFactory(generatorType, this.basePath);

        this.generators[name] = generatorFactory.createSettings(options, this);

        return this.generators[name];
    };

    validate () {
        // !!!!!!!!!!!!
        // TODO: IMPORTANT there is a ref here, dont loose it!,
        if (this.inputDir === null) {
            throw new Error("You must specify an input dir");
        }
        if (this.outputDir === null) {
    //        throw new Error("You must specify a destination dir");
        }
    };
}

type GeneratorConfig = any;

export function loadConfig (path: string, runOptions: any) {
    return when.promise(function(resolve: any, reject: any) {
        var config = new Settings();
        findup(path, "Mddocfile.js", function(err: any, dir: string) {
            if (err) {
                return reject("Could not find Mddocfile.js");
            }
            require(dir + "/Mddocfile.js")(config);

            if (runOptions) {
                config.extend(runOptions);
            }

            config.validate();
            resolve(config);

        });
    });
}
