import { Task } from "@ts-task/task";

import { AnyWontFix } from "../typescript.js";

// TODO: DELETE this file and use the Effect analogy or a Plugin DSL to
// indicate the workflow of the doc generation.
export type Step<E> = () => Task<AnyWontFix, E>;

export function sequence<E1>(steps: Step<E1>[]): Task<void, E1> {
  // clone the steps
  const newSteps = [...steps] as [Step<AnyWontFix>];
  // Remove the next step from the array
  const nextStep = newSteps.shift();
  // If there are any left, resolve inmediatly
  if (!nextStep) {
    return Task.resolve(void 0);
  } else {
    // If there is a step invoke it
    return nextStep().chain(() => sequence(newSteps));
  }
}
