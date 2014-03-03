module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            all: {
                options: {
                    jshintrc: true
                },
                files: {
                    src: ["app.js","src/**/*.js"]
                }
            }
        },
        watch: {
            // Changes in models
            task: {
                files: ["app.js","mddoc.js","index.js", "src/**/*.js", "test/**/*.js"],
                tasks: ["cafemocha", "mddoc"]
            }
        },
        // Executes unitTest
        cafemocha: {
            all: {
                src: "test/*.js",
                options: {
                    ui: "bdd",
                    require: [
                        "should"
                    ]
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-cafe-mocha");


    grunt.registerTask ("mddoc","Runs the mddoc", function() {
        // Force task into async mode and grab a handle to the "done" function.
        var done = this.async();
        grunt.log.error("Checking stuff");
        grunt.warn("tu vieja!");
        grunt.log.error("Checking more stuff");
        if (true ){
            return false;
        }

        var mdDoc = require("./index"),
            utils = mdDoc.utils;

        // Load the project settings
        var mddocSettings = utils.loadJson(".mddoc.json");

        // Run the tool
        mddocSettings.then(function(settings) {
            mdDoc.tool.verbose(true);
            mdDoc.tool.run(settings).then(function () {
                done();
            }, function(err) {
                grunt.log.error("There was an error running the tool " + JSON.stringify(err));
                done(false);
            });
        }, function (err) {
            grunt.log.error("Coundn't read the settings "+ JSON.stringify(err));
            done(false);
        });

    });

    // Default task(s).
    grunt.registerTask("default", ["cafemocha", "mddoc", "watch"]);


};
