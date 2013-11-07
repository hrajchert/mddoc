
var esprima = require("esprima");

var fs = require("fs");

var sourceFile = "src/tool.js";

// var stringToFind = "function getHtml()";
// var stringToFind = "{ root : settings.input";
// var stringToFind = "mds.getHtml = function(mdTemplate)";
// var stringToFind = "parseMdPromise.then(function(mds){";
var stringToFind = "if (!mds.hasOwnProperty(mdTemplate)) {";

var _ = require("underscore");
fs.readFile(sourceFile, "utf8", function(err, source) {
    console.log("reading file " + sourceFile);
    if (err) {
        throw err;
    }
    var charBegin = source.indexOf(stringToFind);
    var charEnd   = charBegin + stringToFind.length;

    var finder = {
        charBegin: charBegin,
        charEnd: charEnd,
        minSize: null,
        minNode: null,
        // Find the smallest node that includes the string
        findNode: function findNode(node) {
            if (node === null) {
                return;
            }

            // Add returns if node.range is out of what we are looking for
            for (var property in node) {
                if (property === "range" || property === "type"){
                    continue;
                }else if (node.hasOwnProperty(property)) {
                    if (_.isArray(node[property])) {
                        _.each(node[property], _.bind(findNode, this));
                    } else if (_.isObject(node[property])) {
                        this.findNode(node[property]);
                    }
                }
            }

            // Check if it includes the string
            if (node.range[0] <= this.charBegin && node.range[1] >= this.charEnd) {
                // Check if this is smaller
                var size = node.range[1] - node.range[0];
                if (this.minSize === null || this.minSize > size) {
                    this.minSize = size;
                    this.minNode = node;
                }
            }
            console.log("Node! of type " + node.type);
            console.log(node.range);

        }
    };


    var AST = esprima.parse(source, {range:true});
    finder.findNode(AST);
    debugger;
    console.log("The minSize is " + finder.minSize);
    console.log("The min node is " + finder.minNode.type);
    console.log(finder.minNode.range);
    console.log("EA EA ["+charBegin + ", " + charEnd + "]");

    console.log(source.substring(finder.minNode.range[0],finder.minNode.range[1]));
});
