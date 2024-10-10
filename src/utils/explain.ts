import PrettyError from "pretty-error";

import { isObject } from "./is-object.js";

const pe = new PrettyError();

interface Explainable {
  explain: () => string;
}

export function isExplainable(error: unknown): error is Explainable {
  return isObject(error) && "explain" in error;
}

export function explain<T extends Explainable>(error: T) {
  if (isExplainable(error)) {
    return error.explain();
  }
}

export function renderError(error: Error) {
  return pe.render(error);
}
