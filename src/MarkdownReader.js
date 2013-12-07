var markdown = require("markdown").markdown,
    walkDir = require("./utils").walkDir,
    when = require("when"),
    crypto = require("crypto"),
    fs = require("fs");

require("colors");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);


var MarkdownFileReader = function (plainFileName, completeFileName) {
    this.plainFileName = plainFileName;
    this.completeFileName = completeFileName;
};

MarkdownFileReader.prototype.setVerbose = function (v) {
    this.verbose = v;
};

MarkdownFileReader.prototype.parse = function () {
    var deferred = when.defer();

    if (this.verbose) {
        console.log("parsing ".yellow + this.completeFileName.grey);
    }

    fs.readFile(this.completeFileName, "utf8", function(err, md) {

        if (err) {
            console.log("There was an error parsing the md file " + err);
            return deferred.reject(err);
        }
        // Get an md5 of the md file
        this.filehash = crypto.createHash("md5").update(md).digest("hex");

        // Parse the markdown into JsonML
        this.jsonml = markdown.parse(md, "miMkd");

        // Indicate the job is done
        deferred.resolve(this);
    }.bind(this));
    return deferred.promise;
};

function doGetReferences (jsonml, references) {
    if ( jsonml[0] === "code_reference" ) {
        // console.log ("we found supercode2");

        // Get the attributes from the jsonml
        var attr = JSON.parse("{"+jsonml[1]+"}");
        // Each attribute must have a src and a ref

        if (typeof attr.src === "undefined" || typeof attr.ref === "undefined") {
            throw "Invalid reference\n" + jsonml[1] ;
        }

        var type;
        if (jsonml[2].type === "code_ref") {
            type = "reference";
        } else if (jsonml[2].type === "code_inc") {
            type = "include";
        }

        var ref = {
            "name" : attr.name?attr.name:false,
            "src" : attr.src,
            "ref" : attr.ref,
            "lineNumber" : jsonml[2].lineNumber,
            // Create a hash from the reference itself
            "refhash" : crypto.createHash("md5").update(jsonml[1]).digest("hex"),
            // TODO: Check this out later
            "status" : "pending",
            "jsonml" : jsonml,
            "type" : type
        };
        // TODO: eventually this could be removed, i think
        jsonml.splice(2);
        references.push(ref);
    } else {
        // console.log ('not this one');
        for (var i=1; i< jsonml.length ; i++) {
            if (Array.isArray(jsonml[i])) {
                doGetReferences(jsonml[i],references);
            }
        }
    }
}

MarkdownFileReader.prototype.getReferences = function () {
    if (typeof this.references === "undefined") {
        this.references = [];
        doGetReferences(this.jsonml, this.references);
    }
    return this.references;
};

MarkdownFileReader.prototype.handleMdError = function(err) {
    return when.reject({
        reader: this,
        err: err
    });
};


var MarkdownReader = function (metadata, settings) {
    this.metadata = metadata;
    this.settings = settings;
};

MarkdownReader.prototype.parse = function() {

    return walkDir(this.settings.inputDir).then(function(files) {
        this.metadata.jsonml = {};
        // Make sure the jsonml doesnt get saved into disk
        Object.defineProperty(this.metadata, "jsonml",{enumerable:false});

        this.metadata.hrMd = {};
        this.metadata.hrCode = {};
        var promises = [];

        var mdre = /(.*)\.md$/;
        // Precalculate the lenght of the name of the input dir
        var dirNameLength = this.settings.inputDir.length;

        for (var i = 0; i<files.length;i++) {
            // Walkdir gives full path, remove the input dir part
            // and check if the file is a md file
            var m = files[i].substr(dirNameLength+1).match(mdre);

            if (m) {
                var plainFileName = m[1],
                    completeFileName =  files[i];

                var mkTask = new MarkdownFileReader(plainFileName, completeFileName);
                mkTask.setVerbose(this.settings.verbose);
                promises.push(
                    // Parse the file
                    mkTask.parse()
                    // Then get the metadata out of it
                    .then(this.analyzeMarkdownFileReader.bind(this))
                    // If anything fails, append the failing reader
                    .otherwise(mkTask.handleMdError.bind(mkTask))
                );
            }
        }
        return when.all(promises);
    }.bind(this));
};

// TODO: I dont like messing with different metadata in one place if that place is not a metadata object.
MarkdownReader.prototype.analyzeMarkdownFileReader = function (mdFileReader) {
    var meta = this.metadata;
    // The jsonml goes directly (TODO: DO i need this?)
    meta.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml;
    // Make sure

    var refs = mdFileReader.getReferences();
    // The hrMd represents the metadata of this file
    meta.hrMd[mdFileReader.plainFileName] = {
        // TODO: Get from package json or something
        "version" : "0.0.1",
        "filehash" : mdFileReader.filehash,
        "refs" : refs
    };
    // For each reference, add it in hrCode in its proper "file"
    for (var i = 0; i < refs.length ; i++  ) {
        var ref = refs[i];
        // Make sure the jsonml doesnt get saved into disk
        Object.defineProperty(ref,"jsonml",{enumerable:false});


        // TODO: unset somewhere the jsonml from the ref, probably in a writetodisk stage

        // console.log(mdFileReader.plainFileName + ": " + ref.lineNumber );
        var hrCodeSrc = meta.hrCode[ref.src];

        if (typeof hrCodeSrc === "undefined") {
            hrCodeSrc = meta.hrCode[ref.src] = {
                "version" : "0.0.1",
                "refs" : {}
            };
        }
        // TODO: I wont be creating a ref when setting a global var
        var loc = {
            "file": mdFileReader.completeFileName,
            "md": mdFileReader.plainFileName,
            "line" : ref.lineNumber
        };
        // Add a reference to this ref, so we can later resolve it, but dont make it enumerable, so
        // it doesnt serialize
        Object.defineProperty(loc, "mdRef", {value: ref, enumerable:false});

        var hrCodeRef = {
            "loc" : [loc],
            "query" : ref.ref,
            "refhash" : ref.refhash
        };
        if (typeof hrCodeSrc.refs[ref.refhash] !== "undefined") {
            throw "Duplicated reference";
            // TODO: Instead of err, warn but add loc
        }
        hrCodeSrc.refs[ref.refhash] = hrCodeRef;
    }
    // meta.hrCode


};

exports.MarkdownReader = MarkdownReader;

