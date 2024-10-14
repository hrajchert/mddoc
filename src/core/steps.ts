import { Effect } from "effect/Effect";
import * as Eff from "effect/Effect";
import { pipe } from "effect/Function";

import { Explainable, isExplainable, renderError } from "../utils/explain.js";

export class StepError {
  _tag = "StepError";

  constructor(
    public step: string,
    public err: unknown,
  ) {}

  explain() {
    let ans = `There was a problem in the step "${this.step}"\n`;
    if (this.err instanceof Error) {
      ans += renderError(this.err);
    } else if (isExplainable(this.err)) {
      ans += this.err.explain();
    } else {
      ans += `Unknown error: ${this.err}`;
    }
    return ans;
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
          s.step,
          Eff.mapError((e) => new StepError(s.name, e)),
        ),
      ),
    ),
    Eff.asVoid,
  );
}
