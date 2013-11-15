var markdown = require("markdown").markdown,
    walkDir = require("./utils").walkDir,
    when = require("when"),
    crypto = require("crypto"),
    fs = require("fs");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);

// TODO: This shouldnt be here
var replaceSupercode = require("./code_includer").replaceSupercode;


var MarkdownFileReader = function (plainFileName, completeFileName) {
    this.plainFileName = plainFileName;
    this.completeFileName = completeFileName;
};

MarkdownFileReader.prototype.parse = function () {
    var deferred = when.defer();

    console.log("parsing " + this.completeFileName);

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

        // this.getReferences();
        // // Remove this
        // replaceSupercode(this.jsonml).then(function(jsonml) {
        //     this.jsonml = jsonml;
        //     deferred.resolve(this);
        // }.bind(this));
    }.bind(this));
    return deferred.promise;
};

function doGetReferences (jsonml, references) {
    if ( jsonml[0] === "supercode" ) {
        console.log ("we found supercode2");

        // Get the attributes from the jsonml
        var attr = JSON.parse("{"+jsonml[1]+"}");
        // Each attribute must have a src and a ref

        if (typeof attr.src === "undefined" || typeof attr.ref === "undefined") {
            throw "Invalid reference\n" + jsonml[1] ;
        }

        var ref = {
            "name" : attr.name?attr.name:false,
            "src" : attr.src,
            "ref" : attr.ref,
            "lineNumber" : jsonml[2],
            // Create a hash from the reference itself
            "refhash" : crypto.createHash("md5").update(jsonml[1]).digest("hex"),
            // TODO: Check this out later
            "status" : "pending",
            "jsonml" : jsonml
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


                console.log(completeFileName + " is a MD file");
                var mkTask = new MarkdownFileReader(plainFileName, completeFileName);

                promises.push(
                    // Parse the file
                    mkTask.parse()
                    // Then get the metadata out of it
                    .then(this.analyzeMarkdownFileReader.bind(this))
                    // If anything fails, apend the failing reader
                    .otherwise(mkTask.handleMdError.bind(mkTask))
                );
            }
        }
        return when.all(promises);
    }.bind(this));
};

MarkdownReader.prototype.analyzeMarkdownFileReader = function (mdFileReader) {
    var meta = this.metadata;
    // The jsonml goes directly
    meta.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml;
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

        // TODO: Remove this!
        ref.jsonml[0]        = "code_block";
        ref.jsonml[1]        = "super crazy block";

        // TODO: unset somewhere the jsonml from the ref, probably in a writetodisk stage

        console.log(mdFileReader.plainFileName + ": " + ref.lineNumber );
        if (typeof meta.hrCode[ref.src] === "undefined") {
            meta.hrCode[ref.src] = {
                "version" : "0.0.1",
                // TODO: Me quede aca, completar comment programming.
            };
        }
    }
    // meta.hrCode


};

exports.MarkdownReader = MarkdownReader;

