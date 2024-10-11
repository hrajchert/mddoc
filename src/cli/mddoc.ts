// #!/usr/bin/env node
import { Options, Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, pipe } from "effect";
import * as R from "effect/Record";

import { loadConfig } from "../config.js";
import * as mddoc from "../core/index.js";
import { toEffect } from "../utils/effect/ts-task.js";
import { isExplainable } from "../utils/explain.js";
import { sequence } from "../utils/ts-task-utils/sequence.js";

// Define the top-level command
const inputDir = Options.text("inputDir").pipe(
  Options.optional,
  Options.withDescription("Path to the folder that has the Markdown files"),
);
const outputDir = Options.text("outputDir").pipe(Options.optional, Options.withDescription("Location of the generated files"));

const command = Command.make("mddoc", { inputDir, outputDir }, (args) =>
  Effect.gen(function* () {
    const cliOptions = R.getSomes({
      inputDir: args.inputDir,
      outputDir: args.outputDir,
    });

    const config = yield* loadConfig(process.cwd(), cliOptions);

    // Initialize the mddoc steps
    const mgr = mddoc.initialize(config);

    // Indicate which steps to run
    const steps = [
      mddoc.readMarkdown(config, mgr),
      mddoc.readCode(config, mgr),
      mddoc.saveMetadata(config, mgr),
      mddoc.replaceReferences(mgr),
      mddoc.generateOutput,
      mddoc.reportNotFound(mgr),
      mddoc.reportStats(mgr),
    ];

    // Run each step
    yield* toEffect(sequence(steps));
  }),
);
// Set up the CLI application
const cli = (args: string[]) =>
  pipe(
    args,
    Command.run(command, {
      name: "mddoc",
      version: "0.0.2",
    }),
    Effect.andThen(() => Console.log("MDDoc finished successfully 🎉")),
    Effect.catchAll((err) => {
      if (isExplainable(err)) {
        return Console.error(err.explain());
      } else {
        return Console.error("ups, improve this");
      }
    }),
  );

// Prepare and run the CLI application
cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
