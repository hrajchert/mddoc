/**
 * This type was added in the update to TypeScript 5.6.2 to quickly solve the issue
 * while documenting the technical debt to have better context of the issue.
 */
export type FixAnyTypeScriptVersion = any;

/**
 * This type alias means that the any type won't be fixed, most likely if
 * the usage is going away.
 * It is good practice to add a comment explaining why this won't be fixed,
 * pointing to the eventual changes to be made.
 */
export type AnyWontFix = any;
