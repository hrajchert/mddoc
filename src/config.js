var _      = require("underscore"),
    findup = require("findup"),
    when   = require("when");


/** @class Settings */
function Settings () {
    /** @property inputDir {String} Path to the folder that has the Markdown files */
    this.inputDir = null;
    /** @member {String} outputDir  Path to the folder that will hold the output of this program */
    this.outputDir = null;
    /** @member {Array.<GeneratorConfig>} generators  A list of generators that indicate how the program
     *                                    should be "printed" */
    this.generators = {};
}

Settings.prototype.initConfig = function (config) {
    this.extend(config);
};

Settings.prototype.extend = function (config) {
    _.extend(this, config);
};


Settings.prototype.addGenerator = function (name, options) {
    this.generators[name] = options;
};


Settings.prototype.validate = function () {
    if (this.inputDir === null) {
        throw new Error("You must specify an input dir");
    }
    if (this.outputDir === null) {
//        throw new Error("You must specify a destination dir");
    }
};

module.exports = {
    loadConfig : function (path, runOptions) {
        return when.promise(function(resolve, reject) {
            var config = new Settings();
            findup(path, "Mddocfile.js", function(err, dir) {
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
};
