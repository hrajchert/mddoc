import { Contract } from "parmenides";
import { AnyWontFix } from "../typescript.js";
// TODO: Delete this in favour of Effect schemas.
export function fromUnknown<T>(contract: Contract<T>) {
  return (value: unknown): T => {
    return contract(value as AnyWontFix);
  };
}
