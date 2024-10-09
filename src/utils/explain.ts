import { UnknownError } from "@ts-task/task";
// TODO: Remove isObject
import { isObject } from "./is-object.js";
import PrettyError from "pretty-error";

const pe = new PrettyError();

interface Explainable {
  explain: () => string;
}

function isExplainable(error: unknown): error is Explainable {
  return isObject(error) && "explain" in error;
}

export function explain<T extends Explainable>(error: T | UnknownError) {
  if (isExplainable(error)) {
    return error.explain();
  } else {
    return "Unknown Error\n" + pe.render(error);
  }
}

export function renderError(error: Error) {
  return pe.render(error);
}
