// Having this without comments cause esprima to freak and a weird
// error by not being able to define step, check it later
//#!/usr/bin/env node


var mddoc = require("./index"),
    utils = require("./src/utils");

var settingsPromise = utils.loadJson(process.cwd() + "/.mddoc.json");

settingsPromise.otherwise(function(err) {
    console.error("There was a problem loading the settings", err);
});

settingsPromise.then(function(settings) {
    try {
        mddoc.initialize(settings);

        var steps = [
            mddoc.readMarkdown,
            mddoc.readCode,
            mddoc.saveMetadata,
            mddoc.replaceReferences,
            mddoc.generateOutput
        ];

        mddoc.run(steps).otherwise(function(e){
            console.error("There was a problem running the tool", e);
        });
    } catch (e) {
        console.error("There was a problem running the tool", e);
    }

});
