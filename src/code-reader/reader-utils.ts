import { IFindResult } from "./code-file-reader.js";

export type IRange = [number, number];
/**
 * This is a helper function that detects that
 * innerRange is inside outerRange. It returns
 * true if its outside of the range, or false otherwise
 * The ranges are Arrays of two dimensions. [a, b] where a <= b
 */
export function isOutOfRange(outerRange: IRange, innerRange: IRange) {
  if (outerRange[0] > innerRange[0]) {
    return true;
  }
  if (outerRange[1] < innerRange[1]) {
    return true;
  }
  return false;
}

export interface IQueriable {
  execute(): IFindResult;
}
