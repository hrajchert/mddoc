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
            },
            documentation: {
                files: ["docs/**/*.md"],
                tasks: ["mddoc"]
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

        var mddoc = require("./index"),
            utils = mddoc.utils;

        // Load the project settings
        var mddocSettings = utils.loadJson(".mddoc.json");

        // Run the tool
        mddocSettings.then(function(settings) {
            mddoc.verbose(true);
            mddoc.initialize(settings);

            var steps = [
                mddoc.readMarkdown,
                mddoc.readCode,
                mddoc.saveMetadata,
                mddoc.replaceReferences,
                mddoc.generateOutput
            ];

            mddoc.run(steps).then(function () {
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
