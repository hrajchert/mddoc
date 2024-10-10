import { Task, UnknownError } from "@ts-task/task";
import * as E from "effect/Effect";
import { Effect } from "effect/Effect";

import { isObject } from "../is-object.js";

const isUnknownError = (err: unknown): err is UnknownError =>
  isObject(err) && "errorType" in err && err.errorType === "UnknownError";

export function toEffect<V, E>(task: Task<V, E | UnknownError>): Effect<V, E> {
  return E.async<V, E>((resume) => {
    task.fork(
      (err) => {
        if (isUnknownError(err)) {
          return resume(E.die(err));
        } else {
          return resume(E.fail(err));
        }
      },
      (value) => resume(E.succeed(value)),
    );
  });
}
