// Having this without comments cause esprima to freak and a weird
//#!/usr/bin/env node


var mddoc   = require("./index"),
    config  = require("./src/config"),
    _       = require("underscore"),
    program = require("commander");

// Configure command line options
program
  .version("0.0.2")
  .option("-i, --inputDir [dir]", "Input dir")
  .option("-o, --outputDir [dir]", "Output dir")
  .parse(process.argv);

var commandLineOptions = _.pick(program, "inputDir", "outputDir");

// Set proccess title
process.title = "mddoc";

// Catch unhandled rejected promises
require("pretty-monitor").start();
var PrettyError = require("pretty-error"),
    pe = new PrettyError();

PrettyError.start(function() {
    // Load the program options
    var settingsPromise = config.loadConfig(process.cwd(), commandLineOptions);

    settingsPromise.done(function(settings) {
        // Initialize the mddoc steps
        mddoc.initialize(settings);

        // Indicate which steps to run
        var steps = [
            mddoc.readMarkdown,
            mddoc.readCode,
            mddoc.saveMetadata,
            mddoc.replaceReferences,
            mddoc.generateOutput
        ];

        // Do magic
        mddoc.run(steps).otherwise(function(e){
            console.error("There was a problem in the step \"" + e.step + "\"");
            console.error(pe.render(e.err));
        });
    }, function(err) {
        console.error("There was a problem loading the settings", err);
    });

});
