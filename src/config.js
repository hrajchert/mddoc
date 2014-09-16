var _      = require("underscore"),
    findup = require("findup"),
    when   = require("when");

var GeneratorManager = require("./generator/GeneratorManager").GeneratorManager;

/** @class */
function Settings () {
    /**
     * Path to the folder that has the Markdown files
     * @member {String}
     */
    this.inputDir = null;
    /**
     * Path to the folder that will hold the output of this program
     * @member {String}
     */
    this.outputDir = null;
    /**
     * A list of generators that indicate how the program should be "printed"
     * @member {Array.<GeneratorConfig>}
     */
    this.generators = {};

    /**
     * The base path of the project
     * @member {String}
     */
    this.basePath = process.cwd();
}

Settings.prototype.initConfig = function (config) {
    this.extend(config);
};

Settings.prototype.extend = function (config) {
    _.extend(this, config);
};


Settings.prototype.addGenerator = function (name, options) {
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
