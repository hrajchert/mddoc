var when = require("when"),
    fs = require("fs");
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


exports.loadJson = loadJson;
