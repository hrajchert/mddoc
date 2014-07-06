// Having this without comments cause esprima to freak and a weird
//#!/usr/bin/env node


var mddoc = require("./index"),
    config = require("./src/config");

// Catch unhandled rejected promises
require("pretty-monitor").start();
var PrettyError = require("pretty-error"),
    pe = new PrettyError();

// Configure command line options
var _ = require("underscore");
var program = require("commander");

program
  .version("0.0.2")
  .option("-i, --inputDir [dir]", "Input dir")
  .option("-o, --outputDir [dir]", "Output dir")
  .parse(process.argv);

var runtimeOptions = _.pick(program, "inputDir", "outputDir");

PrettyError.start(function() {
    var settingsPromise = config.loadConfig(process.cwd() + "/.mddoc.json", runtimeOptions);

    settingsPromise.done(function(settings) {

        mddoc.initialize(settings);

        var steps = [
            mddoc.readMarkdown,
            mddoc.readCode,
            mddoc.saveMetadata,
            mddoc.replaceReferences,
            mddoc.generateOutput
        ];

        mddoc.run(steps).otherwise(function(e){
            console.error("There was a problem in the step \"" + e.step + "\"");
            console.error(pe.render(e.err));
        });
    }, function(err) {
        console.error("There was a problem loading the settings", err);
    });

});
