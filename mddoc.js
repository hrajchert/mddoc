#!/usr/bin/env node


var tool = require("./src/tool");
var utils = require("./src/utils");

utils.loadJson(process.cwd() + "/.mddoc.json").then(
    function(settings) {
        try {
           tool.run(settings).otherwise(function(e){
                console.error("There was a problem running the tool", e);
           });
        } catch (e) {
            console.error("There was a problem running the tool", e);
        }

    },
    function(err) {
        console.log("There was a problem loading the settings", err);
    }
);
