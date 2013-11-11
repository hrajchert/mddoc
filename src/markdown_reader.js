var markdown = require("markdown").markdown,
    walkDir = require("./utils").walkDir,
    when = require("when"),
    fs = require("fs"),
    keys = require("when/keys");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);

// TODO: This shouldnt be here
var replaceSupercode = require("./code_includer").replaceSupercode;

exports.parseMd = function parseMd (settings) {
    var deferred = when.defer();

    walkDir(settings.inputDir).then(function(files) {
        var mdre = /(.*)\.md$/;
        var mds = {};
        var dirNameLength = settings.inputDir.length;
        for (var i = 0; i<files.length;i++) {
            var m = files[i].substr(dirNameLength+1).match(mdre);

            if (m) {
                var plainFileName = m[1],
                    completeFileName =  files[i];


                console.log(completeFileName + " is a MD file");
                mds[plainFileName] = doParse(completeFileName);
            }
        }
        deferred.resolve(keys.all(mds));
    });

    return deferred.promise;
};


function doParse(completeFileName) {
    var deferred = when.defer();
    fs.readFile(completeFileName, "utf8", function(err, md) {
        console.log("doparsing " + completeFileName);
        if (err) {
            console.log("super err " + err);
            return deferred.reject(err);
        }
        var parsedMd = markdown.parse(md, "miMkd");
        deferred.resolve(replaceSupercode(parsedMd));
    });
    return deferred.promise;
}