#!/usr/bin/env node


var tool = require("./src/tool");

try {
    var settings = require(process.cwd() + "/.mddoc.json");
    tool.run(settings);
}
catch(e) {
    console.log("No config file present");
}