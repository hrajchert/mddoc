/**
 * @typedef Settings
 * @property {String} inputDir   Path to the folder that has the Markdown files
 * @property {String} outputDir  Path to the folder that will hold the output of this program
 * @property {Array.<GeneratorConfig>} generators  A list of generators that indicate how the program
 *                                                 should be "printed"
 *
 */

var _      = require("underscore"),
    findup = require("findup"),
    when   = require("when");

var ConfigManager = function () {
    this.config = {};
};

ConfigManager.prototype.initConfig = function (config) {
    this.extend(config);
};

ConfigManager.prototype.extend = function (config) {
    _.extend(this.config, config);
};


ConfigManager.prototype.addGenerator = function (name, options) {
    // Make sure the generators property exists
    if (!this.config.hasOwnProperty("generators")) {
        this.config.generators = {};
    }
    this.config.generators[name] = options;
};


ConfigManager.prototype.validate = function () {
    if (!this.config.hasOwnProperty("inputDir")) {
        throw new Error("You must specify an input dir");
    }
    if (!this.config.hasOwnProperty("outputDir")) {
        throw new Error("You must specify a destination dir");
    }
};

ConfigManager.prototype.getConfig = function () {
    return this.config;
};

module.exports = {
    loadConfig : function (path, runOptions) {
        return when.promise(function(resolve, reject) {
            var configManager = new ConfigManager();
            findup(path, "Mddocfile.js", function(err, dir) {
                if (err) {
                    return reject("Could not find Mddocfile.js");
                }
                require(dir + "/Mddocfile.js")(configManager);

                if (runOptions) {
                    configManager.extend(runOptions);
                }

                configManager.validate();
                resolve(configManager.getConfig());

            });
        });
    }
};
