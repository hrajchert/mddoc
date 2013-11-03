/*jshint -W065 */
var markdown = require("markdown").markdown;

// Configure my parser
require("./src/md_parser.js")(markdown.Markdown);

var _ = require("underscore");
var fs = require("fs");
var when = require("when");
var keys = require("when/keys");

var settings = require("./documentor.json");


function replaceSupercode (jsonml) {
    if ( jsonml[0] === "supercode" ) {
        console.log ("we found supercode");

        var attr = JSON.parse("{"+jsonml[1]+"}");

        return replaceCodeFromFile(jsonml, attr.src, attr.line );
    } else {
        // console.log ('not this one');
        var promises = [];
        for (var i=1; i< jsonml.length ; i++) {
            if (Array.isArray(jsonml[i])) {
                var p = replaceSupercode(jsonml[i]);
                promises[i] = p;
            }
        }
        return when.all(promises);
    }
}

function replaceCodeFromFile(jsonml, file, lineNumber) {
    var deferred = when.defer();

    fs.readFile(file, "utf8", function(err, data) {
        if (err) {
            return deferred.reject(err);
        }

        var lines = data.split("\n");
        var numbers = lineNumber.split("-");
        if ( numbers.length !== 2 ) {
            return deferred.reject("The line number wasnt correctly spelled");
        }

        var firstLine = parseInt(numbers[0]);
        var lastLine = parseInt(numbers[1]);

        if (typeof firstLine !== "number" || typeof lastLine !== "number") {
            return deferred.reject("Those arent numbers cowboy");
        }

        if (firstLine > lastLine) {
            return deferred.reject("lastLine cannot be bigger than firstLine");
        }
        var ans = lines[firstLine - 1];
        for (var i=firstLine + 1; i <= lastLine;i++) {
            ans += "\n" + lines[ i - 1 ];
        }

        jsonml[0] = "code_block";
        jsonml[1] = ans;
        deferred.resolve();
    });
    return deferred.promise;
}
/**
 * Method that walks a directory and returns a promise of all the files in it. Recursivly
 * @param  string dir The directory to walk
 * @return promise    A promise of an array that holds all the files
 */
function walkDir (dir) {
    return doWalkDir(dir).then(function(files) {
        return _.flatten(files);
    });
}

/**
 * This is the recursive method that actually does the walking. It is
 * needed to have both methods as this recursiveness doesn't provide a flattened
 * array
 */
function doWalkDir(dir) {
    var
        // The promise to return
        deferred = when.defer(),
        // An array of promise of the file stat (to see if we need to recurse or not)
        filePromises = [];

    // Get all the files (including subdirectories)
    fs.readdir(dir, function(err, files){
        if (err) {
            return deferred.reject(err);
        }

        // For each file, check if directory. If it is, recurse, if not
        // boom.
        for (var i=0;i < files.length; i++) {
            // We need to create a file info object because of how the scope in
            // js works. TODO: Add more documentation about this later! But not in the code!
            var fileInfo = {
                file: dir + "/" + files[i],
                defer: when.defer()
            };
            // Because checking if the file is a directory or not is async, we need to hold
            // a promise of its checking
            filePromises[i] = fileInfo.defer.promise;
            // Check if it is a directory or not
            fs.stat(fileInfo.file, _.bind(checkIfDirectory, fileInfo));
        }
        deferred.resolve(when.all(filePromises));
    });

    return deferred.promise;
}

/**
 * Callback that checks if a file is a directory or not.
 * It is separated from the main function because you shouldn't define functions in a loop.
 * Because of the bind, this refers to the fileInfo
 */
function checkIfDirectory(err, stat) {
    if (err) {
        return this.defer.reject(err);
    }
    // If its not a directory, resolve it on the spot with the name of the file
    if (!stat.isDirectory()) {
        this.defer.resolve(this.file);
    }
    // If it is, resolve it once its subdirectory is resolved
    else {
        this.defer.resolve(doWalkDir(this.file));
    }
}





function doParse(completeFileName) {
    var deferred = when.defer();
    fs.readFile(completeFileName, "utf8", function(err, md) {
        console.log("doparsing " + completeFileName);
        if (err) {
            console.log("super err " + err);
            return deferred.reject(err);
        }
        var parsedMd = markdown.parse(md, "miMkd");
        replaceSupercode(parsedMd).then(function(){
            deferred.resolve(parsedMd);
        });
    });
    return deferred.promise;
}

function parseMd (settings) {
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
}

var ECT = require("ect");
var renderer = ECT({ root : settings.inputDir });

var parseMdPromise = parseMd(settings);

function renderedFileWroteHandler(err) {
    if (err) {
        throw err;
    }
    console.log("We wrote " + this.outputFile);
}

function getHtml() {
    return renderer.render(this.inputFile, this.data);
}

parseMdPromise.then(function(mds){
    console.log("The input is parsed");
    mds.getHtml = function(mdTemplate) {
        var tree;
        if (!mds.hasOwnProperty(mdTemplate)) {
            throw "We Couldnt find a md template with the name " + mdTemplate;
        }
        try {
            tree = markdown.toHTMLTree(mds[mdTemplate]);
        }catch (e) {
            throw "Couldnt create html for template " + mdTemplate;
        }

        return markdown.renderJsonML(tree);
    };

    var data = { documentor : mds };

    for (var i=0; i<settings.files.length; i++) {
        try {
            var renderObject = {
                inputFile: settings.files[i] + ".ect",
                outputFile: settings.outputDir + "/" + settings.files[i] + ".html",
                getHtml: getHtml,
                data: data
            };


            fs.writeFile(renderObject.outputFile,
                         renderObject.getHtml(),
                         _.bind(renderedFileWroteHandler,renderObject));

        } catch (e) {
            console.log(e);
        }

    }
});

parseMdPromise.otherwise(function(err){
    console.log("Could not parse the markdown's");
    console.log(err);
});

/*
fs.readFile(inputFile, 'utf8', function(err, md) {
    fs.readFile('template.html', 'utf8', function(err, template) {

        var jsonml = markdown.parse(md, 'miMkd');

        // debugger;
        var p = replaceSupercode(jsonml);
        p.then(function() {
            var tree = markdown.toHTMLTree(jsonml);
            var html = markdown.renderJsonML(tree);
            var output = _.template(template,{html: html});
            fs.writeFile(outputFile, output, function(err){
                console.log('its done');
            });
        });
    });
});
*/
