export function isObject (obj: unknown): obj is Object {
    return typeof obj === 'object' && obj !== null;
}