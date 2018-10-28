var _ = require("underscore"),
    when = require("when"),
    fs = require("fs");
var utils = require('@ts-task/utils')
var walkDir = require('./ts-task-utils/walkDir').walkDir;
/**
 * Helper method that loads a json file in form of a promise
 * @param   string  jsonFile The path of the json file to load
 * @returns Promise          A promise of the json object
 */
function loadJson(jsonFile) {
    var p = when.defer();
    // Try to read the file
    fs.readFile(jsonFile, function(err, str) {
        // Inform if it was any errors
        if (err) {
            return p.reject({msg: "Reading error", file: jsonFile, err: err});
        }

        // Try to parse the file as a json or fail otherwise
        try {
            var jsonParse = JSON.parse(str);
            p.resolve(jsonParse);
        } catch (e) {
            console.error("json failed " + jsonFile);
            p.reject({msg: "Parsing error", file: jsonFile, err: e});
        }
    });
    return p.promise;
}

// TODO: delete when possible, use task version
function _doCreateDirIfNeeded(path) {
    var p = when.defer();

    // Try to get dir statistics
    fs.stat(path, function (err) {
        // If it doesnt exists, try to create it
        if (err && err.code === "ENOENT") {
            fs.mkdir(path, function(err) {
                if (err) {
                   // Cant create directory
                    p.reject(err);
                } else {
                   // Directory created
                    p.resolve();
                }
            });
        } else if (err) {
            // Cant stat the file
            return p.reject(err);

        } else {
            // If it exists resolve as nothing
            return p.resolve();
        }
    });
    return p.promise;
}

// Holds the directories checked to see if needed to be created
// This way we both save resource and avoid race conditions
// TODO: delete when possible, use task version
var _dirsChecked = {};

// TODO: delete when possible, use task version
function _createDirIfNeeded(path) {
    // If we have a request to check the path,  respond that directly
    if (!_dirsChecked.hasOwnProperty(path)) {
        // If not, check and store the promise
        _dirsChecked[path] = _doCreateDirIfNeeded(path);
    }
    return _dirsChecked[path];
}

// TODO: delete when possible, use task version
function promiseWriteFile(path, data) {
    var p = when.defer();
    fs.writeFile(path, data, function(err) {
        if (err) {
            p.reject(err);
        } else {
            p.resolve();
        }
    });
    return p.promise;
}

/**
 * Writes the contents of data in a file with filename. It creates
 * any directory it needs in order to create the file
 * @param string path The path of the file to write
 * @param {type} data The data to write
 */
function writeFileCreateDir(path, data) {
    path = path.trim();
    // Don't allow absolute paths, for now

    // Extract the different directories as an array, and the filename separated
    var parts = path.split("/");

    // If the parth is absolute, correct the parts
    if (path[0] === "/") {
        parts.shift();
        parts[0] = "/" + parts[0];
    }

    parts.pop(); //filename

    // Create all the dirs needed to open the file
    var dirReady = when.reduce(parts, function(path, part) {
        if (path === "") {
            path = part;
        } else {
            path = path + "/" + part;
        }


        // Create the current path if needed and return a promise of the next
        return _createDirIfNeeded(path).then(function(){
            return path;
        });
    }, "");

    // Once we have the directory ready, write the file
    return dirReady.then(function() {
        return promiseWriteFile(path, data);
    });

}

function copyFile(src, dst) {
    return when.promise(function(resolve, reject) {
        fs.readFile(src, "utf8", function (err, f) {
            if (err) {
                return reject(err);
            }
            return resolve(writeFileCreateDir(dst, f));
        });
    });
}

/**
 * Works like unix copy -R.
 * Copies the files from src_dir to dst_dir, creating the necesary folders in dst_dir to make that happen
 */
// TODO: change matchRe for the classical include exclude folders
function copyDir(src, dst, matchRe) {

    return utils.toPromise(walkDir(src)).then(function(files) {
        var promises = [];
        // Precalculate the lenght of the name of the src dir
        var dirNameLength = src.length;

        for (var i = 0; i<files.length;i++) {
            var m = files[i].match(matchRe);
            if (m) {
                var copyOptions = {
                    inputFilename: files[i],
                    outputFilename: dst + "/" + files[i].substr(dirNameLength+1)
                };
//                console.log(copyOptions.inputFilename.grey + " => ".green + copyOptions.outputFilename.grey);

                // Copy the file
//                fs.readFile(copyOptions.inputFilename, "utf8", _copyDir_copyFile.bind(copyOptions));
                promises.push(copyFile(copyOptions.inputFilename,copyOptions.outputFilename));
            }
        }
        return when.all(promises);
    });
}

exports.loadJson = loadJson;
exports.writeFileCreateDir = writeFileCreateDir;
exports.copyDir = copyDir;
