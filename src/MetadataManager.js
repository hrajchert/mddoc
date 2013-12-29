var fs = require("fs"),
    crypto = require("crypto");

var MetadataManager = function (settings) {
    this.settings = settings;
};

/**
 * Creates the basic structure for the metadata.
 */
MetadataManager.prototype.initialize = function () {
    this.metadata = {};

    // Create a structure in the metadata to hold the JsonML that later on will become the HTML
    this.metadata.jsonml = {};
    // And make sure it doesn't get saved into disk
    Object.defineProperty(this.metadata, "jsonml",{enumerable:false});

    // Create a structure to hold the references from the markdown to the code
    this.metadata.hrMd = {};

    // Create a structure to hold the inferred references from the code to the markdown
    this.metadata.hrCode = {};

    // Create a structure to hold the missing references
    this.metadata.notFound = {};
};


/**
 * Expose the metadata.
 */
MetadataManager.prototype.getPlainMetadata = function () {
    if (typeof this.metadata === "undefined") {
        throw new Error("Metadata not initialized yet");
    }
    return this.metadata;
};

/**
 * Write the metadata to disk
 */
MetadataManager.prototype.save = function() {
    // Write down the metadata
    var metadataFileName = this.settings.outputDir + "/metadata.json";
    var metadataStr = JSON.stringify(this.metadata, null, "    ");
    fs.writeFile(metadataFileName, metadataStr, function(err){
        if (err) {
            console.log("There was a problem writing the metadata".red + err);
            throw new Error("cant write the metadata " + err);
        }
        console.log("Metadata written to ".green + metadataFileName.grey);
    });
};


MetadataManager.prototype.renameThisMethod = function (markdownReader, codeReader) {
    markdownReader.on("md-file-parsed", "createJsonMLMetadata", this.createJsonMLMetadata.bind(this));
    markdownReader.on("md-file-parsed", "createHrMdMetadata", this.createHrMdMetadata.bind(this));
    markdownReader.on("md-file-parsed", "createHrCodeMetadata", this.createHrCodeMetadata.bind(this));

    codeReader.on("code-file-read", "updateHrMdMetadata", this.updateHrMdMetadata.bind(this),["updateHrCodeMetadata"]);
    codeReader.on("code-file-read", "updateHrCodeMetadata", this.updateHrCodeMetadata.bind(this));
    codeReader.on("code-file-read", "updateNotFound", this.updateNotFound.bind(this));
};


MetadataManager.prototype.createJsonMLMetadata = function (mdFileReader) {
    var meta = this.metadata;
    // The jsonml goes directly
    meta.jsonml[mdFileReader.plainFileName] = mdFileReader.jsonml;
};

MetadataManager.prototype.createHrMdMetadata = function (mdFileReader) {
    var meta = this.metadata;

    var refs = mdFileReader.getReferences();
    // The hrMd represents the metadata of this file
    meta.hrMd[mdFileReader.plainFileName] = {
        // TODO: Get from package json or something
        "version" : "0.0.1",
        "filehash" : mdFileReader.filehash,
        "refs" : refs
    };
};

MetadataManager.prototype.updateHrMdMetadata = function(codeFileReader) {
    var hrCode = this.metadata.hrCode[codeFileReader.src];
    var found;
    // Update the hrMd part
    for (var refhash in codeFileReader.results) {
        var loc = hrCode.refs[refhash].loc;

        for(var i = 0; i < loc.length ; i++ ) {
            var hrMdRef = loc[i].mdRef;
            found = hrCode.refs[refhash].found;
            hrMdRef.found = found;
            if (found) {
                // TODO: Decide if I want to have or not the snippet in hdMd
                // hrMdRef.snippet = hrCode.refs[refhash].snippet;
                hrMdRef.snippetHash = hrCode.refs[refhash].snippetHash;
                hrMdRef.char = {
                    from: codeFileReader.results[refhash].range[0],
                    to: codeFileReader.results[refhash].range[1]
                };
            }
        }
    }
};


MetadataManager.prototype.updateNotFound = function (codeFileReader) {
    var found;
    var meta = this.metadata;
    var hrCode = this.metadata.hrCode[codeFileReader.src];
    for (var refhash in codeFileReader.results) {

        found = hrCode.refs[refhash].found;
        if (!found) {
            meta.notFound[refhash] = {
                loc: hrCode.refs[refhash].loc,
                src: codeFileReader.src,
                query: hrCode.refs[refhash].query
            };
        }
    }
};

MetadataManager.prototype.createHrCodeMetadata = function (mdFileReader) {
    var meta = this.metadata;

    var refs = mdFileReader.getReferences();

    // For each reference, add it in hrCode in its proper "file"
    for (var i = 0; i < refs.length ; i++  ) {
        var ref = refs[i];
        // Make sure the jsonml doesnt get saved into disk
        Object.defineProperty(ref,"jsonml",{enumerable:false});

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
            "refhash" : ref.refhash,
            // I dont like this one
            "directive": ref.directive
        };
        if (typeof hrCodeSrc.refs[ref.refhash] !== "undefined") {
            throw new Error("Duplicated reference");
            // TODO: Instead of err, warn but add loc
        }
        hrCodeSrc.refs[ref.refhash] = hrCodeRef;
    }
};

MetadataManager.prototype.updateHrCodeMetadata = function (codeFileReader) {
    // Update the hrCode part
    var hrCode = this.metadata.hrCode[codeFileReader.src];
    var refhash, found, snippet, md5;
    hrCode.filehash = codeFileReader.md5;
    for (refhash in codeFileReader.results) {
        found = codeFileReader.results[refhash].found;
        hrCode.refs[refhash].found = found;
        if (found) {
            snippet = codeFileReader.results[refhash].snippet;
            md5 = crypto.createHash("md5").update(snippet).digest("hex");

            hrCode.refs[refhash].snippet = snippet;
            hrCode.refs[refhash].snippetHash = md5;
            hrCode.refs[refhash].char = {
                from: codeFileReader.results[refhash].range[0],
                to: codeFileReader.results[refhash].range[1]
            };
        }
    }
};






exports.MetadataManager = MetadataManager;


