import { IQueriable, IRange, IFileReaderQuery, isOutOfRange } from "./reader-utils";
import { CodeFileReader, IFindResult } from "./CodeFileReader";
const _ = require('underscore');

export class CodeFinderQueryJsText implements IQueriable {
    queryRange?: IRange;
    minSize?: number;
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
        if (typeof this.queryRange === 'undefined') throw 'queryRange should be defined';

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
        var source = this.codeFileReader.source as string;
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