import * as fs from 'fs';

var
    crypto = require("crypto"),
    _ = require("underscore"),
    esprima = require("esprima"),
    EventPromise = require("./EventPromise"),
    when = require("when"),
    nodefn = require("when/node/function")

;

import 'colors';

/**
 * This is a helper function that detects that
 * innerRange is inside outerRange. It returns
 * true if its outside of the range, or false otherwise
 * The ranges are Arrays of two dimensions. [a, b] where a <= b
 */
function isOutOfRange (outerRange, innerRange) {
    if (outerRange[0] > innerRange[0]  ) {
        return true;
    }
    if (outerRange[1] < innerRange[1]) {
        return true;
    }
    return false;
}

var CodeFinderQueryLine = function (codeFileReader, query) {
    this.codeFileReader = codeFileReader;

    if ( !query.hasOwnProperty("line" )) {
        throw new Error("Line is mandatory!");
    }

    var numbers = query.line.split("-");
    if ( numbers.length !== 2 ) {
        throw new Error("The line number wasnt correctly spelled");
    }

    this.firstLine = parseInt(numbers[0], 10);
    this.lastLine = parseInt(numbers[1], 10);
    if (isNaN(this.firstLine) || isNaN(this.lastLine)) {
        throw new Error("The line attribute should be a number");
    }

    if (this.firstLine > this.lastLine) {
        throw new Error("Last line number cannot be bigger than first line number");
    }
};

CodeFinderQueryLine.prototype.execute = function () {
    var lines = this.codeFileReader.lines;
    if (this.lastLine > lines.length) {
        return {found:false};
    }
    var snippet = "";
    var range = [0,0];
    range[0] = lines[this.firstLine].range[0];
    range[1] = lines[this.lastLine].range[1];

    for (var i = this.firstLine ; i <= this.lastLine ; i++) {
        snippet += lines[i].text + "\n";
    }
    return {snippet: snippet, range: range, found: true};
};


var CodeFinderQueryJsText = function(codeFileReader, query) {
    this.codeFileReader = codeFileReader;
    this.query = query;
};

// Que es minimum
// Expecificar el array de hijos en el nodo.
// Poner en meta doc como es el arbol AST y lo min
// Explicar que node es de entrada y tree de salida.
// Ya no tengo que trackear el size,
/**
 * Finds the minimum AST node that contains the queryRange. The queryRange is an array
 * stored in the object that contains the position of the found text. The queryRange has the following
 * signature [firstCharacter, lastCharacter], where firstCharacter is the
 * position of first character of the queried text, and lastCharacter is the last one.
 * @param  AST    node An esprima generated AST
 * @param  array  tree An empty array should be provided, the result will be the resulting tree from the root
 *                     till the minNode.
 * @return integer      The number of visited nodes to find the min one
 */
CodeFinderQueryJsText.prototype.findMinNode = function findMinNode (node, tree) {
    // Check that the value is a node and that we are still on the queryRange
    if (node === null || !_.isObject(node) || isOutOfRange(node.range, this.queryRange )){
        return 0;
    }
    // If im here, im in range.

    // Save this node as the smaller node that still contains the queryRange
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // TODO: THIS has a ref explaining why I made this decision, try not to loose the reference
    // in the refactor
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    var size = node.range[1] - node.range[0];
    this.minSize = size;
    this.minNode = node;
    tree.push(node);

    // Count will hold the number of visited nodes from this node to the minNode,
    // it starts with one, marking this node as visited.
    var count = 1;
    var newNode;
    var nodesToSkip = ["range", "type"];

    // We traverse the node childrens using recursion
    for (var property in node) {
        // Skip attributes we know are not children nodes
        if (nodesToSkip.indexOf(property) !== -1) {
            continue;
        }

        newNode = node[property];
        // Make sure the attribute is an array (convert if needed), to
        // treat all attributes as an array of children nodes.
        if (!_.isArray(newNode)) {
            newNode = [newNode];
        }

        // For each child node call this function recursively and increase
        // the visited node count.
        for (var i = 0; i < newNode.length; i++) {
            count += this.findMinNode(newNode[i], tree);
        }
    }
    // Return how many nodes we visited to find the minNode
    return count;
};

CodeFinderQueryJsText.prototype.execute = function() {
    var source = this.codeFileReader.source;
    var str = this.query.text;
    var charBegin = source.indexOf(str);
    var charEnd   = charBegin + str.length;

    // console.log("Char begin = " + charBegin);
    if (charBegin === -1) {
        return {found: false};
    }

    this.queryRange = [charBegin, charEnd];
    var tree = [];
    this.findMinNode(this.codeFileReader.AST, tree);
    // console.log(c + " nodes where visited");
    // console.log("The minSize is " + this.minSize);
    // console.log("The min node is " + this.minNode.type);
    // console.log(this.minNode.range);
    // console.log("EA EA ["+charBegin + ", " + charEnd + "]");

    // for (var i=0; i< tree.length;i++) {
    //     console.log("tree " + i + " = " + tree[i].type);
    // }

    var result = {
        snippet: source.substring(this.minNode.range[0],this.minNode.range[1]),
        range: this.minNode.range,
        found: true
    };
    return result;
};

exports.CodeFinderQueryJsText = CodeFinderQueryJsText;

/**
 * Reads a file and find the references
 * @param  Object findOptions The information needed to find the references.
 *                            Inside, it must have the source file to read, and a hash
 *                            of references to find.
 */
var CodeFileReader = function(findOptions) {
    if ( typeof findOptions.src === "undefined") {
        throw new Error("You need to provide a source file");
    }
    this.src = findOptions.src;

    this.references = findOptions.references;
    this.verbose = findOptions.verbose;
};

/**
 * This is the entry point to the class, the method that controls the inner logic.
 * It returns a promise of "this", that will be resolved once the code file is read, and
 * the references found.
 * @return Promise A promise of this
 */
CodeFileReader.prototype.read = function() {
    var promise;
    // First we need to read the file and parse the AST
    promise = this.pre();

    // Once we have the file, we need to call the right finder for each reference
    promise = promise.then(function(){
        this.results = {};
        var ref, refhash, codeFinder;
        for (refhash in this.references) {
            ref = this.references[refhash];
            // console.log("We need to parse a reference ".yellow + refhash.grey);
            // console.log(ref);
            // If it has a line property,
            if ( ref.query.hasOwnProperty("line")) {
                // console.log("Instantiating Line query ".yellow);
                codeFinder = new CodeFinderQueryLine(this, ref.query);
            } else if ( ref.query.hasOwnProperty("text")) {
                // console.log("Instantiating Text query ".yellow);
                codeFinder = new CodeFinderQueryJsText(this, ref.query);
            }
            this.results[refhash] = codeFinder.execute();
            // console.log("This is the result:".red);
            // console.log(this.results[refhash].snippet);
        }
        // The finders are sync, so we can just return this (thus, promise of this)
        return this;
    }.bind(this));
    // Return the promise of this
    return promise;

};

Object.defineProperty(CodeFileReader.prototype, "lines", {
    get: function() {
        if (!("_lines" in this) ) {
            // console.log("Calculating lines!".inverse);
            var _lines = [];
            var charNumber = 0,
                l = this.source.split("\n"),
                i, len;
            for (i = 0; i < l.length ; i++) {
                len = l[i].length;
                _lines.push({
                    text: l[i],
                    range: [charNumber, charNumber + len]
                });
                charNumber += len;
            }
            Object.defineProperty(this, "_lines", {value: _lines});
        }
        return this._lines;
    }
});

// TODO: Rename this
CodeFileReader.prototype.pre = function() {
    var self = this;

    return nodefn.call(fs.readFile, self.src, "utf8").then(function(source) {
        if (self.verbose) {
            console.log("reading code file ".blue + self.src.grey);
        }

        self.source = source;
        self.md5 = crypto.createHash("md5").update(source).digest("hex");

        // TODO: maybe change this only if needed.
        self.AST = esprima.parse(source, {range:true});

        return self;
    });

};







var CodeReader = function (metadata, settings) {
    this.metadata = metadata;
    this.settings = settings;
};

// Add event promises to the MarkdownReader
EventPromise.mixin(CodeReader.prototype);

CodeReader.prototype.read = function () {
    var hrCode = this.metadata.hrCode;
    var promises = [];
    var codeFileReader;

    // Method to add context to an error in the parsing of a md file
    var handleError = function(err) {
        err.reader = this;
        return when.reject(err);
    };

    for (var file in hrCode) {
        codeFileReader = new CodeFileReader({
            src: file,
            references: hrCode[file].refs,
            verbose: this.settings.verbose
        });

        promises.push(
            // Read the file
            codeFileReader.read()
            // Then get the metadata out of it
            .then(this.updateMetadata.bind(this))
            // If anything fails, append the failing reader
            .otherwise(handleError.bind(codeFileReader))
        );
    }
    // console.log(this.metadata.hrCode);
    return when.all(promises);
};


CodeReader.prototype.updateMetadata = function (codeFileReader) {
    return this.trigger("code-file-read", codeFileReader);
};


exports.CodeReader = CodeReader;




// var finder = new CodeFileReader({
//     src: sourceFile,
//     query: {
//         text: stringToFind
//     }
// });

// // Find the snippet
// var findPromise = finder.find();

// // Print it if found
// findPromise.then(function(result) {
//     var snippet = result.snippet;
//     console.log(snippet);
//     var md5 = crypto.createHash("md5").update(snippet).digest("hex");
//     console.log(md5);

// });

// // Log error if not
// findPromise.otherwise(function(err){
//     console.log("Coudln't find snippet: " + err);
// });
