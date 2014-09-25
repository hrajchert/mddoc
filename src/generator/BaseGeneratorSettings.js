var _ = require("underscore");
/**
 * @class
 */
function BaseGeneratorSettings (options, globalSettings) {
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

BaseGeneratorSettings.prototype.getGeneratorType = function () {
    if (this.generatorType === null) {
        throw Error('Generator type not set');
    }
    return this.generatorType;
};

module.exports = BaseGeneratorSettings;
