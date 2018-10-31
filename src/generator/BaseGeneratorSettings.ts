import { Settings } from "../config";

var _ = require("underscore");

export interface BaseGeneratorSettingsOptions {
    relativeOutputDir?: string;
    outputDir?: string;
    priority?: number;
}

export class BaseGeneratorSettings  {
    generatorType: string | null;
    priority = 100;
    outputDir?: string;


    constructor (options: BaseGeneratorSettingsOptions, globalSettings: Settings) {
        _.extend(this, options);

        if (options.hasOwnProperty("relativeOutputDir")) {
            this.outputDir = globalSettings.outputDir + "/" + options.relativeOutputDir;
        }
        // If it doesn't have relativeOutputDir nor outputDir, use the globalSetting outputDir
        else if (!options.hasOwnProperty("outputDir")) {
            this.outputDir = globalSettings.outputDir;
        }

        // If it doesn't have priority, give a default of 100
        if (!options.hasOwnProperty("priority")) {
            this.priority = 100;
        }
        // TODO: maybe normalize path, right?

        /**
         * The name of the generator type. Should be overrided by each
         * custom GeneratorSettings object
         * @member {String}
         */
        this.generatorType = null;
    }


    getGeneratorType () {
        if (this.generatorType === null) {
            throw Error('Generator type not set');
        }
        return this.generatorType;
    };
}

