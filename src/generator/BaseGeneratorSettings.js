var _ = require("underscore");
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
}

module.exports = BaseGeneratorSettings;
