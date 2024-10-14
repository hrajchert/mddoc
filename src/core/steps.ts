import { Cause } from "effect/Cause";
import * as C from "effect/Cause";
import { Effect } from "effect/Effect";
import * as Eff from "effect/Effect";
import { pipe } from "effect/Function";

import { Explainable, renderError } from "../utils/explain.js";

export class StepError {
  _tag = "StepError";

  constructor(
    public step: string,
    public err: Cause<Explainable>,
  ) {}

  explain() {
    const message = C.match(this.err, {
      onEmpty: "empty cause",
      onFail: (e) => e.explain(),
      onDie: (e) => `Unknown error: ${renderError(e)}`,
      onInterrupt: () => "Fiber interrupted",
      onSequential: (left, right) => `${left} then ${right}`,
      onParallel: (left, right) => `${left} and ${right}`,
    });
    return `There was a problem in the step "${this.step}"\n: ${message}`;
  }
}

export type Step = {
  name: string;
  step: Effect<unknown, Explainable>;
};

export function runSteps(steps: Step[]): Effect<void, StepError> {
  return pipe(
    // Run all the steps encapsulating any errors in a StepError
    Eff.all(
      steps.map((s) =>
        pipe(
          Eff.sandbox(s.step),
          Eff.mapError((e) => new StepError(s.name, e)),
        ),
      ),
    ),
    Eff.asVoid,
  );
}
