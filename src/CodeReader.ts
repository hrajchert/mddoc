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

type IRange = [Number, Number];
/**
 * This is a helper function that detects that
 * innerRange is inside outerRange. It returns
 * true if its outside of the range, or false otherwise
 * The ranges are Arrays of two dimensions. [a, b] where a <= b
 */
function isOutOfRange (outerRange: IRange, innerRange: IRange) {
    if (outerRange[0] > innerRange[0]  ) {
        return true;
    }
    if (outerRange[1] < innerRange[1]) {
        return true;
    }
    return false;
}

interface ICodeFinderLineQuery {
    line: string; // '2-14'
}

class CodeFinderQueryLine implements IQueriable {
    firstLine: number;
    lastLine: number;

    constructor (public codeFileReader: CodeFileReader, query: ICodeFinderLineQuery) {
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
    }

    execute (): IFindResult {
        var lines = this.codeFileReader.lines;
        if (this.lastLine > lines.length) {
            return {found:false};
        }
        var snippet = "";
        var range = [0, 0] as IRange;
        range[0] = lines[this.firstLine].range[0];
        range[1] = lines[this.lastLine].range[1];

        for (var i = this.firstLine ; i <= this.lastLine ; i++) {
            snippet += lines[i].text + "\n";
        }
        return {snippet: snippet, range: range, found: true};
    };
}

interface IFoundResult {
    found: true;
    snippet: string;
    range: IRange;
}
interface INotFoundResult {
    found: false;
}

type IFindResult = IFoundResult | INotFoundResult;

interface IQueriable {
    execute (): IFindResult
}
// exports.CodeFinderQueryJsText = CodeFinderQueryJsText;
interface IFileReaderQuery {
    text: string;
}

export class CodeFinderQueryJsText implements IQueriable {
    queryRange: IRange;
    minSize: number;
    minNode: any;

    constructor (public codeFileReader: CodeFileReader, public query: IFileReaderQuery) {
    }

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
    findMinNode (node: any, tree: any) {
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
    }

    execute (): IFindResult {
        var source = this.codeFileReader.source;
        var str = this.query.text;
        var charBegin = source.indexOf(str);
        var charEnd   = charBegin + str.length;

        // console.log("Char begin = " + charBegin);
        if (charBegin === -1) {
            return {found: false};
        }

        this.queryRange = [charBegin, charEnd];
        var tree = [] as any[];
        this.findMinNode(this.codeFileReader.AST, tree);
        // console.log(c + " nodes where visited");
        // console.log("The minSize is " + this.minSize);
        // console.log("The min node is " + this.minNode.type);
        // console.log(this.minNode.range);
        // console.log("EA EA ["+charBegin + ", " + charEnd + "]");

        // for (var i=0; i< tree.length;i++) {
        //     console.log("tree " + i + " = " + tree[i].type);
        // }

        return {
            snippet: source.substring(this.minNode.range[0],this.minNode.range[1]),
            range: this.minNode.range,
            found: true
        };
    }
}

type IFindReferenceMap = {
    [ref: string]: {
        directive: string;
        query: any;
        loc: any;
        refhash: string;
    }
};

export interface IFindOptions {
    references: IFindReferenceMap;
    src: string;
    verbose: boolean;
}

/**
 * Reads a file and find the references
 * @param  Object findOptions The information needed to find the references.
 *                            Inside, it must have the source file to read, and a hash
 *                            of references to find.
 */
class CodeFileReader {
    src: string;
    references: IFindReferenceMap;
    verbose: boolean;
    source: string;
    md5: string;
    AST: any;
    results: {
        [ref: string]: IFindResult
    };

    constructor (findOptions: IFindOptions) {
        if ( typeof findOptions.src === "undefined") {
            throw new Error("You need to provide a source file");
        }
        this.src = findOptions.src;

        this.references = findOptions.references;
        this.verbose = findOptions.verbose;
    }

    /**
     * This is the entry point to the class, the method that controls the inner logic.
     * It returns a promise of "this", that will be resolved once the code file is read, and
     * the references found.
     * @return Promise A promise of this
     */
    read () {
        var promise;
        // First we need to read the file and parse the AST
        promise = this.pre();

        // Once we have the file, we need to call the right finder for each reference
        promise = promise.then(() => {
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
                if (codeFinder) {
                    this.results[refhash] = codeFinder.execute();
                } else {
                    this.results[refhash] = { found: false };
                }
                // console.log("This is the result:".red);
                // console.log(this.results[refhash].snippet);
            }
            // The finders are sync, so we can just return this (thus, promise of this)
            return this;
        });
        // Return the promise of this
        return promise;
    }

    // TODO: Rename this
    pre () {
        return nodefn.call(fs.readFile, this.src, "utf8").then((source: any) => {
            if (this.verbose) {
                console.log("reading code file ".blue + this.src.grey);
            }

            this.source = source;
            this.md5 = crypto.createHash("md5").update(source).digest("hex");

            // TODO: maybe change this only if needed.
            this.AST = esprima.parse(source, {range:true});

            return this;
        });
    }

    private _lines: any[];
    get lines () {
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
}










// exports.CodeReader = CodeReader;


export class CodeReader {
    eventPromise: any;
    constructor (public metadata: any, public settings: any) {
        this.eventPromise = EventPromise.create();

    }

    on (...args: any[]) {
        this.eventPromise.on(...args);
    }
    trigger (...args: any[]) {
        this.eventPromise.trigger(...args);
    }

    read () {
        var hrCode = this.metadata.hrCode;
        var promises = [];
        var codeFileReader;

        // Method to add context to an error in the parsing of a md file
        const self = this;
        var handleError = function(err: any) {
            err.reader = self;
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


    updateMetadata (codeFileReader: any) {
        return this.trigger("code-file-read", codeFileReader);
    };

}




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
