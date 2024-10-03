import * as ts from "typescript";
import { isObject } from "../utils/is-object.js";
import { CodeFileReader, IFindResult } from "./code-file-reader.js";
import { IQueriable, IRange, isOutOfRange } from "./reader-utils.js";

/**
 * This is a plain text search in the document.
 */
export interface IFileReaderQuery {
  text: string;
}

export function isTextQuery(query: unknown): query is IFileReaderQuery {
  return isObject(query) && query.hasOwnProperty("text");
}

export class CodeFinderQueryJsText implements IQueriable {
  queryRange?: IRange;
  minSize?: number;
  minNode: ts.Node | null = null;

  constructor(
    public codeFileReader: CodeFileReader,
    public query: IFileReaderQuery,
  ) {}

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
   * @param  node The generated AST
   * @param  path An empty array should be provided, the result will be the resulting tree from the root
   *                     till the minNode.
   * @return integer      The number of visited nodes to find the min one
   */
  findMinNode(node: ts.Node, path: ts.Node[]) {
    if (typeof this.queryRange === "undefined") throw "queryRange should be defined";
    const nodeRange = [node.pos, node.end] as IRange;

    if (isOutOfRange(nodeRange, this.queryRange)) {
      return 1;
    }

    const size = nodeRange[1] - nodeRange[0];
    this.minSize = size;
    this.minNode = node;
    path.push(node);

    let count = 0;

    node.forEachChild((node) => {
      count += this.findMinNode(node, path);
    });
    return count;
  }

  execute(): IFindResult {
    const source = this.codeFileReader.source as string;
    const str = this.query.text;
    const charBegin = source.indexOf(str);
    const charEnd = charBegin + str.length;

    // console.log("Char begin = " + charBegin);
    if (charBegin === -1) {
      return { found: false, reason: "text not found" };
    }

    this.queryRange = [charBegin, charEnd];
    const tree = [] as ts.Node[];

    this.findMinNode(this.codeFileReader.AST as ts.SourceFile, tree);

    // console.log(c + " nodes where visited");
    // console.log("The minSize is " + this.minSize);
    // console.log("The min node is " + this.minNode);
    // console.log(this.minNode.range);
    // console.log("EA EA ["+charBegin + ", " + charEnd + "]");

    // for (var i=0; i< tree.length;i++) {
    //     console.log("tree " + i + " = " + tree[i].type);
    // }

    if (this.minNode) {
      return {
        snippet: source.substring(this.minNode.pos, this.minNode.end),
        range: [this.minNode.pos, this.minNode.end],
        found: true,
      };
    } else {
      return { found: false, reason: "AST node not found" };
    }
  }
}
