var _ = require("underscore"),
    when = require("when"),
    fs = require("fs");

/**
 * Method that walks a directory and returns a promise of all the files in it. Recursivly
 * @param  string dir The directory to walk
 * @return promise    A promise of an array that holds all the files
 */
exports.walkDir = function (dir) {
    return doWalkDir(dir).then(function(files) {
        return _.flatten(files);
    });
};

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