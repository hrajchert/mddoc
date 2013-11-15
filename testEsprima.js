var fs = require("fs"),
    crypto = require("crypto"),
    _ = require("underscore"),
    esprima = require("esprima"),
    when = require("when");


var sourceFile = "src/tool.js";

var stringToFind = "function getHtml()";
// var stringToFind = "{ root : settings.input";
// var stringToFind = "mds.getHtml = function(mdTemplate)";
// var stringToFind = "parseMdPromise.then(function(mds){";
// var stringToFind = "if (!mds.hasOwnProperty(mdTemplate)) {";
// var stringToFind = "parseMdPromise.then(function(mds){ss";


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

var CodeFinderQuery = function(codeFinder, query) {
    this.codeFinder = codeFinder;
    this.query = query;
};

/**
 * Finds the minimum AST node that contains the queryRange. The queryRange is an array
 * stored in the object that contains as a first value the first character in the source file
 * to get, and as the second value the last character.
 * @param  AST    node An esprima generated AST
 * @param  array  tree An empty array should be provided, the result will be the resulting tree from the root
 *                     till the minNode.
 * @return integer      The number of visited nodes to find the min one
 */
CodeFinderQuery.prototype.findMinNode = function findMinNode (node, tree) {
    // Check that the value is a node and that we are still on the looking range
    if (node === null || !_.isObject(node) || isOutOfRange(node.range, this.queryRange )){
        return 0;
    }

    // I used to check if the node range was smaller or not, but if its in range (not out of range),
    // the node will always be smaller and smaller in each children.
    var size = node.range[1] - node.range[0];
    this.minSize = size;
    this.minNode = node;
    tree.push(node);
    // console.log("Node! of type " + node.type);
    // console.log(node.range);

    // Lets count how many nodes we visit to get the minNode
    var count = 1;
    var newNode = null;
    var nodesToSkip = ["range", "type"];

    // Each node has attributes that can contain children nodes, we visit them here
    for (var property in node) {
        // Check is not one of the "no nodes"
        if (nodesToSkip.indexOf(property) !== -1) {
            continue;
        }

        newNode = node[property];
        // Make sure its an array
        if (!_.isArray(newNode)) {
            newNode = [newNode];
        }
        for (var i = 0; i < newNode.length; i++) {
            count += this.findMinNode(newNode[i], tree);
        }
    }
    return count;
};

CodeFinderQuery.prototype.execute = function() {
    var source = this.codeFinder.source;
    var str = this.query.text;
    var charBegin = source.indexOf(str);
    var charEnd   = charBegin + str.length;

    console.log("Char begin = " + charBegin);
    if (charBegin === -1) {
        throw "The text was not found (" + str + ")" ;
    }

    this.queryRange = [charBegin, charEnd];
    var tree = [];
    var c = this.findMinNode(this.codeFinder.AST, tree);
    console.log(c + " nodes where visited");
    console.log("The minSize is " + this.minSize);
    console.log("The min node is " + this.minNode.type);
    console.log(this.minNode.range);
    console.log("EA EA ["+charBegin + ", " + charEnd + "]");

    for (var i=0; i< tree.length;i++) {
        console.log("tree " + i + " = " + tree[i].type);
    }

    var result = {
        snippet: source.substring(this.minNode.range[0],this.minNode.range[1])
    };
    return result;
};

/**
 * Class that helps find a code snippet.
 */
var CodeFinder = function(findOptions) {
    this.findOptions = findOptions;
};

CodeFinder.prototype.find = function() {
    return this.pre().then(function(){
        this.queryObject = new CodeFinderQuery(this, this.findOptions.query);
        return this.queryObject.execute();
    }.bind(this));

};
CodeFinder.prototype.pre = function() {
    var findPromise = when.defer();
    console.log("reading file " + this.findOptions.src);
    fs.readFile(this.findOptions.src, "utf8", function(err, source) {
        this.source = source;

        // TODO: Change this
        if (err) {
            return findPromise.reject(err);
        }

        this.AST = esprima.parse(source, {range:true});

        findPromise.resolve(this);
    }.bind(this));

    return findPromise.promise;
};



var finder = new CodeFinder({
    src: sourceFile,
    query: {
        text: stringToFind
    }
});

// Find the snippet
var findPromise = finder.find();

// Print it if found
findPromise.then(function(result) {
    var snippet = result.snippet;
    console.log(snippet);
    var md5 = crypto.createHash("md5").update(snippet).digest("hex");
    console.log(md5);

});

// Log error if not
findPromise.otherwise(function(err){
    console.log("Coudln't find snippet: " + err);
});

