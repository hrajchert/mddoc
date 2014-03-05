var markdown = require("markdown").markdown,
    walkDir = require("./utils").walkDir,
    EventPromise = require("./EventPromise"),
    when = require("when"),
    crypto = require("crypto"),
    fs = require("fs"),
    nodefn = require("when/node/function");

require("colors");

// Configure my parser
require("./markdown_parser.js")(markdown.Markdown);

/**
 * Class that reads a markdown file and gets references to the code out of it
 * @class
 * @param   {String}    plainFileName       The logical file path
 * @param   {String}    completeFileName    The real file path from the working directory
 */
var MarkdownFileReader = function (plainFileName, completeFileName) {
    this.plainFileName = plainFileName;
    this.completeFileName = completeFileName;
};

/**
 * Indicate if the parser should print verbose logging
 * @param   {bool}      v       Whether it should be verbose or not
 */
MarkdownFileReader.prototype.setVerbose = function (v) {
    this.verbose = v;
};

/**
 * Read and parse the markdown file into a JsonML object.
 * @return  {Promise}           A Promise of self that will be resolved
 *                              once the file is parsed
 */
MarkdownFileReader.prototype.parse = function () {
    var self = this;
    return nodefn.call(fs.readFile, self.completeFileName, "utf8").then(function(md) {
        if (self.verbose) {
            console.log("parsing ".yellow + self.completeFileName.grey);
        }
        // Get an md5 of the md file
        self.filehash = crypto.createHash("md5").update(md).digest("hex");

        // Parse the markdown into JsonML
        self.jsonml = markdown.parse(md, "miMkd");

        // Indicate the job is done
        return self;
    });
};

/**
 * @summary Actually do get the references from the parsed markdown file
 *
 * @desc    Traverse the JsonML and extract all code references. Parse needs
 *          to be called before this
 *
 * @return  {Array.Reference}   The references
 * @private
 */
MarkdownFileReader.prototype._doGetReferences = function  (jsonml) {
    var references = [];
    // For each markdown block
    for (var i=1; i< jsonml.length ; i++) {
        var mlBlock = jsonml[i];
        // If its not an actual JsonML block, move on
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

            // Interpret the reference
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
    return references;
};

/**
 * @summary Get any code references from the parsed markdown file
 *
 * @desc    This method serves as a cache method only, the real reference extraction
 *          is done with {@link _doGetReferences}
 *
 *
 * @return  {Array.Reference}   The references
 */
MarkdownFileReader.prototype.getReferences = function () {
    if (typeof this.references === "undefined") {
        this.references = this._doGetReferences(this.jsonml);

    }
    return this.references;
};










/**
 * @summary Class in charge of reading the markdown files, and getting some metadata out of them.
 *
 * @desc    We are especially interested in the references made from the md files to the source code
 *
 * @param   {Object}    settings    The mddoc configuration for this project
 * @constructor
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

        // Method to add context to an error in the parsing of a md file
        var handleMdError = function(err) {
            err.reader = this;
            return when.reject(err);
        };

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
                    .otherwise(handleMdError.bind(mkTask))
                );
            }
        }
        // Return a promise that will be resolved once all the markdown files are parsed
        return when.all(promises);
    });
};

/**
 * TODO: Revisit this
 */
MarkdownReader.prototype.analyzeMarkdownFileReader = function (mdFileReader) {
    return this.trigger("md-file-parsed", mdFileReader);
};


exports.MarkdownReader = MarkdownReader;

