/**
 * @typedef Settings
 * @property {String} inputDir   Path to the folder that has the Markdown files
 * @property {String} outputDir  Path to the folder that will hold the output of this program
 * @property {Array.<GeneratorConfig>} generators  A list of generators that indicate how the program
 *                                                 should be "printed"
 *
 */

var utils = require("./utils"),
    _     = require("underscore");


module.exports = {
    loadConfig : function (path, runOptions) {
        // Load the config file
        return utils.loadJson(path).then(function (config){
            _.extend(config, runOptions);
            // Validate minimum settings
            if (!config.hasOwnProperty("inputDir")) {
                throw new Error("You must specify an input dir");
            }
            if (!config.hasOwnProperty("outputDir")) {
                throw new Error("You must specify a destination dir");
            }

            return config;
        });
    }
};
