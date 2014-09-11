var _ = require("underscore"),
    when = require("when"),
    fs = require("fs");


var isFileExcluded = function (file, options) {
    var isExcluded = false;
    var exclude;
    if (_.isObject(options) && options.hasOwnProperty("exclude")) {
        exclude = options.exclude;
    }
    if (_.isString(exclude)) {
        exclude = [exclude];
    }
    if (_.isArray(exclude)) {
        _.forEach(exclude, function (exc) {
                if (file.match(exc)) {
                    isExcluded = true;
                }
        });
    }
    return isExcluded;
};
/**
 * Method that walks a directory and returns a promise of all the files in it. Recursivly
 * @param  string dir      The directory to walk
 * @param  object options  For now an object that has exclude
 * @return promise    A promise of an array that holds all the files
 */
var walkDir = function (dir, options) {
    return _doWalkDir(dir, options).then(function(files) {
        return _.flatten(files);
    });
};

/**
 * @private
 * This is the recursive method that actually does the walking. It is
 * needed to have both methods as this recursiveness doesn't provide a flattened
 * array
 */
function _doWalkDir(dir, options) {
    return when.promise(function(resolve, reject) {
        // An array of promise of the file stat (to see if we need to recurse or not)
        var filePromises = [];

        // Get all the files (including subdirectories)
        fs.readdir(dir, function(err, files){
            if (err) {
                return reject(err);
            }

            // For each file, check if directory. If it is, recurse, if not
            // boom.
            for (var i=0;i < files.length; i++) {
                var filename = dir + "/" + files[i];
                // Do not include excluded files
                if (isFileExcluded(filename, options)) {
                    continue;
                }
                // We need to create a file info object because of how the scope in
                // js works. TODO: Add more documentation about this later! But not in the code!
                var fileInfo = {
                    file: filename,
                    defer: when.defer(),
                    options: options
                };
                // Because checking if the file is a directory or not is async, we need to hold
                // a promise of its checking
                filePromises[i] = fileInfo.defer.promise;
                // Check if it is a directory or not
                fs.stat(fileInfo.file, _.bind(_checkIfDirectory, fileInfo));
            }
            resolve(when.all(filePromises));
        });
    });
}

/**
 * @private
 * Callback that checks if a file is a directory or not.
 * It is separated from the main function because you shouldn't define functions in a loop.
 * Because of the bind, this refers to the fileInfo
 */
function _checkIfDirectory(err, stat) {
    if (err) {
        return this.defer.reject(err);
    }
    // If its not a directory, resolve it on the spot with the name of the file
    if (!stat.isDirectory()) {
        this.defer.resolve(this.file);
    }
    // If it is, resolve it once its subdirectory is resolved
    else {
        this.defer.resolve(_doWalkDir(this.file, this.options));
    }
}

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
var _dirsChecked = {};

function _createDirIfNeeded(path) {
    // If we have a request to check the path,  respond that directly
    if (!_dirsChecked.hasOwnProperty(path)) {
        // If not, check and store the promise
        _dirsChecked[path] = _doCreateDirIfNeeded(path);
    }
    return _dirsChecked[path];
}

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

    return walkDir(src).then(function(files) {
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

exports.walkDir = walkDir;
exports.loadJson = loadJson;
exports.writeFileCreateDir = writeFileCreateDir;
exports.copyDir = copyDir;
