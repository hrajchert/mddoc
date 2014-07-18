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
                tasks: ["cafemocha", "mddoc","jsdoc"]
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
        },
        jsdoc : {
            dist : {
                src: ["src/MarkdownReader.js","src/MetadataManager.js", "src/config.js"],
                options: {
                    destination: "dist/custom-generator/jsdoc"
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-cafe-mocha");
    grunt.loadNpmTasks("grunt-jsdoc");

    grunt.registerTask ("mddoc","Runs the mddoc", function() {
        // Force task into async mode and grab a handle to the "done" function.
        var done = this.async();

        var mddoc = require("./index"),
            config = mddoc.config;

        // Load the project settings
        var mddocSettings = config.loadConfig(process.cwd());

        // Run the tool
        mddocSettings.done(function(settings) {
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
    grunt.registerTask("default", ["cafemocha", "mddoc", "jsdoc", "watch"]);


};
