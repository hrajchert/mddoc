// Having this without comments cause esprima to freak and a weird
//#!/usr/bin/env node

const mddoc   = require("./index");
const config  = require("./src/config");
const _       = require("underscore");
const program = require("commander");

// Configure command line options
program
  .version("0.0.2")
  .option("-i, --inputDir [dir]", "Input dir")
  .option("-o, --outputDir [dir]", "Output dir")
  .parse(process.argv);

const commandLineOptions = _.pick(program, "inputDir", "outputDir");

// Set proccess title
process.title = "mddoc";

// Catch unhandled rejected promises
require("pretty-monitor").start();
const PrettyError = require("pretty-error");
const pe = new PrettyError();

PrettyError.start(function() {
    // Load the program options
    const settingsPromise = config.loadConfig(process.cwd(), commandLineOptions);

    settingsPromise.done(function(settings: any) {
        // Initialize the mddoc steps
        mddoc.initialize(settings);

        // Indicate which steps to run
        const steps = [
            mddoc.readMarkdown,
            mddoc.readCode,
            mddoc.saveMetadata,
            mddoc.replaceReferences,
            mddoc.generateOutput
        ];

        // Do magic
        mddoc.run(steps).otherwise(function(e: any){
            console.error("There was a problem in the step \"" + e.step + "\"");
            console.error(pe.render(e.err));
        });
    }, function(err: any) {
        console.error("There was a problem loading the settings", err);
    });

});
