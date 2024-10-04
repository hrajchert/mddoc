// #!/usr/bin/env node

import * as mddoc from "./index.js";
import { loadConfig } from "./src/config.js";
import { toEffect } from "./src/utils/effect/ts-task.js";
import { explain } from "./src/utils/explain.js";
import { sequence } from "./src/utils/ts-task-utils/sequence.js";
import { Options, Command } from "@effect/cli";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { Console, Effect, pipe, Option } from "effect";
import * as R from "effect/Record";

// Define the top-level command
const inputDir = Options.text("inputDir").pipe(
  Options.optional,
  Options.withDescription("Path to the folder that has the Markdown files"),
);
const outputDir = Options.text("outputDir").pipe(Options.optional, Options.withDescription("Location of the generated files"));

const command = Command.make("mddoc", { inputDir, outputDir }, (args) => {
  return pipe(
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
    Effect.tapBoth({
      onFailure: (err) => Console.error(explain(err)),
      onSuccess: () => Console.log("MDDoc finished successfully 🎉"),
    }),
  );
});

// Set up the CLI application
const cli = Command.run(command, {
  name: "mddoc",
  version: "0.0.2",
});

// Prepare and run the CLI application
cli(process.argv).pipe(Effect.provide(NodeContext.layer), NodeRuntime.runMain);
