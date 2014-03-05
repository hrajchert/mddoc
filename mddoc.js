// Having this without comments cause esprima to freak and a weird
//#!/usr/bin/env node


var mddoc = require("./index"),
    utils = require("./src/utils");

// Catch unhandled rejected promises
require("pretty-monitor").start();
var PrettyError = require("pretty-error"),
    pe = new PrettyError();


PrettyError.start(function() {
    var settingsPromise = utils.loadJson(process.cwd() + "/.mddoc.json");

    settingsPromise.otherwise(function(err) {
        console.error("There was a problem loading the settings", err);
    });

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
            console.error("There was a problem in the step " + e.step);
            console.error(pe.render(e.err));
        });
    });

});
