import { UnknownError } from "@ts-task/task";
import PrettyError from "pretty-error";

// TODO: Remove isObject
import { isObject } from "./is-object.js";

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
