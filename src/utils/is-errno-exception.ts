import { isObject } from './is-object';

export function isErrnoException (err: unknown): err is NodeJS.ErrnoException {
    return isObject(err) && err.hasOwnProperty('code') && err.hasOwnProperty('errno');
}