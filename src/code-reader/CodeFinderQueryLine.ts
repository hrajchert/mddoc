import { IQueriable, IRange } from "./reader-utils";
import { CodeFileReader, IFindResult } from "./CodeFileReader";

// The starting and ending line to reference separated by a dash (ex "2-24")
export interface ICodeFinderLineQuery {
    line: string; // '2-14'
}

export function isLineQuery (query: any): query is ICodeFinderLineQuery {
    return query.hasOwnProperty("line");
}

export class CodeFinderQueryLine implements IQueriable {
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