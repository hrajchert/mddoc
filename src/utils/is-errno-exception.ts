import { isObject } from "./is-object.js";

export function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return isObject(err) && Object.prototype.hasOwnProperty.call(err, "code") && Object.prototype.hasOwnProperty.call(err, "errno");
}
