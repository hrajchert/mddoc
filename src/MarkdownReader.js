var markdown = require("markdown").markdown,
    walkDir = require("./utils").walkDir,
    EventPromise = require("./EventPromise"),
    when = require("when"),
    crypto = require("crypto"),
    fs = require("fs");

require("colors");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);

/**
 * Class that reads a markdown file and gets references to the code out of it
 */
var MarkdownFileReader = function (plainFileName, completeFileName) {
    this.plainFileName = plainFileName;
    this.completeFileName = completeFileName;
};

MarkdownFileReader.prototype.setVerbose = function (v) {
    this.verbose = v;
};


MarkdownFileReader.prototype.parse = function () {
    var self = this;
    return when.promise(function(resolve, reject) {
        if (self.verbose) {
            console.log("parsing ".yellow + self.completeFileName.grey);
        }

        fs.readFile(self.completeFileName, "utf8", function(err, md) {

            if (err) {
                console.log("There was an error parsing the md file " + err);
                return reject(err);
            }
            // Get an md5 of the md file
            self.filehash = crypto.createHash("md5").update(md).digest("hex");

            // Parse the markdown into JsonML
            self.jsonml = markdown.parse(md, "miMkd");

            // Indicate the job is done
            resolve(self);
        });
    });
};

function _doGetReferences (jsonml, references) {
    for (var i=1; i< jsonml.length ; i++) {
        var mlBlock = jsonml[i];
        if (!Array.isArray(mlBlock)) {
            continue;
        }
        // See if this block is a code reference block
        if ( mlBlock[0] === "code_reference" ) {
            // Get the attributes from the jsonml
            var attr = JSON.parse("{"+mlBlock[1]+"}");

            // Each attribute must have a src and a ref
            if (typeof attr.src === "undefined" || typeof attr.ref === "undefined") {
                throw new Error("Invalid reference\n" + mlBlock[1]) ;
            }

            var referencingMl = null;
            if ( i > 1 ) {
                referencingMl = jsonml[i-1];
            }

            var ref = {
                "name" : attr.name?attr.name:false,
                "src" : attr.src,
                "ref" : attr.ref,
                "lineNumber" : mlBlock[2].lineNumber,
                // Create a hash from the reference itself
                "refhash" : crypto.createHash("md5").update(mlBlock[1]).digest("hex"),
                // TODO: Check this out later
                "status" : "pending",
                "jsonml" : mlBlock,
                "refMl": referencingMl,
                "directive" : mlBlock[2].type
            };

            // Make sure the jsonml doesnt get saved into disk
            Object.defineProperty(ref,"jsonml",{enumerable:false});
            // Neither there referencing one
            Object.defineProperty(ref,"refMl",{enumerable:false});

            // TODO: eventually this could be removed, i think
            // I have to remove the third argument as it is the extra data (that cant be rendered).
            // I Can't remember why I said this code could be removed.
            mlBlock.splice(2);
            // Add the reference to the reference list
            references.push(ref);
        } else {
            // This block its not a reference, but it might have inner references
            // NOT FOR NOW.
        }
    }

}


MarkdownFileReader.prototype.getReferences = function () {
    if (typeof this.references === "undefined") {
        this.references = [];
        _doGetReferences(this.jsonml, this.references);
    }
    return this.references;
};

MarkdownFileReader.prototype.handleMdError = function(err) {
    return when.reject({
        reader: this,
        err: err
    });
};









/**
 * Reads the documentation files, aka the markdown and generates a JsonML tree
 * TODO: Improve the doc
 */
var MarkdownReader = function (settings) {
    this.settings = settings;
};

// Add event promises to the MarkdownReader
EventPromise.mixin(MarkdownReader.prototype);

/**
 * Walks the documentation folder, also known as input dir, and parses the markdown files
 * in it
 * @returns Promise     A promise that will be resolved once the markdowns are parsed
 */
MarkdownReader.prototype.parse = function() {
    var self = this;
    // Walk the input dir recursively, get a list of all files
    return walkDir(self.settings.inputDir).then(function(files) {

        var promises = [];
        var mdre = /(.*)\.md$/;

        // Precalculate the lenght of the name of the input dir
        var dirNameLength = self.settings.inputDir.length;

        // For each input file
        for (var i = 0; i<files.length;i++) {
            // Check that the file is a markdown file
            var match = files[i].substr(dirNameLength+1).match(mdre);

            if (match) {
                var plainFileName = match[1],
                    completeFileName =  files[i];

                // Create and configure the object that will read and parse the markdown
                var mkTask = new MarkdownFileReader(plainFileName, completeFileName);
                mkTask.setVerbose(self.settings.verbose);

                // Store a promise to:
                promises.push(
                    // parse the file,
                    mkTask.parse()
                    // then extract some metadata out of it
                    .then(self.analyzeMarkdownFileReader.bind(self))
                    // and if anything fails, append some error information to the promise
                    .otherwise(mkTask.handleMdError.bind(mkTask))
                );
            }
        }
        // Return a promise that will be resolved once all the markdown files are parsed
        return when.all(promises);
    });
};

MarkdownReader.prototype.analyzeMarkdownFileReader = function (mdFileReader) {
    return this.trigger("md-file-parsed", mdFileReader);
};


exports.MarkdownReader = MarkdownReader;

