var fs = require("fs"),
    when = require("when");


exports.replaceSupercode = function (jsonml) {
    return doReplaceSupercode(jsonml).then(function() {
        return jsonml;
    });
};

function doReplaceSupercode (jsonml) {
    if ( jsonml[0] === "supercode" ) {
        console.log ("we found supercode");

        var attr = JSON.parse("{"+jsonml[1]+"}");

        return replaceCodeFromFile(jsonml, attr.src, attr.line );
    } else {
        // console.log ('not this one');
        var promises = [];
        for (var i=1; i< jsonml.length ; i++) {
            if (Array.isArray(jsonml[i])) {
                var p = doReplaceSupercode(jsonml[i]);
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

        var firstLine = parseInt(numbers[0], 10);
        var lastLine = parseInt(numbers[1], 10);

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
