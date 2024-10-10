import { Task } from "@ts-task/task";
import * as E from "effect/Effect";
import { Effect } from "effect/Effect";

export function toEffect<V, E>(task: Task<V, E>): Effect<V, E> {
  return E.async<V, E>((resume) => {
    task.fork(
      (err) => resume(E.fail(err)),
      (value) => resume(E.succeed(value)),
    );
  });
}
