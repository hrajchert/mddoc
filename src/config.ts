import { ParseError } from "@effect/schema/ParseResult";
import { Schema } from "@effect/schema/Schema";
import * as S from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as R from "effect/Record";

import { getGeneratorManager } from "./generator/generator-manager.js";
import { toEffect } from "./utils/effect/ts-task.js";
import { renderError } from "./utils/explain.js";
import { findup } from "./utils/ts-task-fs-utils/findup.js";

const DEFAULT_PRIORITY = 100;

// This schema is used to validate the final settings object.
// It is used after the config file is read, the cli arguments are parsed
// and its a final check to all the required settings are present.
const settingsSchema = S.Struct({
  inputDir: S.String,
  outputDir: S.String,
  basePath: S.String,
  verbose: S.Boolean,
  inputExclude: S.optional(S.Union(S.String, S.Array(S.String))),
  generators: S.Record({
    key: S.String,
    value: S.Struct({
      generatorType: S.String,
      priority: S.Number,
      outputDir: S.String,
    }),
  }),
}).annotations({ title: "Settings" });

export interface BaseGeneratorSettings {
  generatorType: string;
  priority: number;
  outputDir: string;
}

export interface Settings {
  /**
   * Wether we should be verbose on output or not
   */
  verbose: boolean;

  // Markdown Reader
  /**
   * Path to the folder that has the Markdown files
   * TODO: see if we can change from the path of the markdown files to a list of
   * blobs of files that can contain references... markdown or even javascript, typescript files
   */
  inputDir: string;

  /**
   * Regexp to exclude some of the files in the input. TODO: revisit this
   */
  inputExclude?: string | readonly string[] | undefined;
  // end Markdown Reader

  /**
   * Path to the folder that will hold the output of this program
   */
  outputDir: string;

  /**
   * A list of generators that indicate how the program should be "printed"
   */
  generators: Record<string, BaseGeneratorSettings>;

  /**
   * The base path of the project
   */
  // basePath = process.cwd();
  basePath: string;
}

function requireConfigFile(dir: string) {
  const configFile = dir + "/Mddocfile.js";
  return Effect.tryPromise({
    try: () => import(configFile).then((x) => x.default()),
    catch: (err) => new ConfigFileError(`Could not require the config file: ${err}`),
  });
}

// This schema is used to validate the config file.
const configFileSettings = S.Struct({
  inputDir: S.String,
  outputDir: S.String,
  basePath: S.optional(S.String),
  verbose: S.optional(S.Boolean),
  inputExclude: S.optional(S.Union(S.String, S.Array(S.String))),
  generators: S.optional(
    S.Record({
      key: S.String,
      value: S.Struct({
        generatorType: S.optional(S.String),
        priority: S.optional(S.Number),
        outputDir: S.optional(S.String),
      }),
    }),
  ),
}).annotations({ title: "ConfigFileSettings" });

type ConfigFileSettings = Schema.Type<typeof configFileSettings>;

function readAndValidateConfigFile(path: string) {
  // Find the closest config file
  return pipe(
    toEffect(findup(path, "Mddocfile.js")),
    Effect.mapError((_) => new ConfigFileError("Could not find Mddocfile.js")),
    Effect.andThen((path) => requireConfigFile(path)),
    Effect.andThen(S.decodeUnknown(configFileSettings, { onExcessProperty: "preserve" })),
    Effect.catchTag("ParseError", (err) => Effect.fail(new ErrorParsingConfigFile(err))),
  );
}

function validateGenerators(config: ConfigFileSettings) {
  const basePath = config.basePath || process.cwd();
  const generators = config.generators || {};

  const tasks = pipe(
    generators,
    R.map((generator, genName) =>
      Effect.gen(function* () {
        // By default, the generator type is the name, but you can override it in the options
        // In case you want to have two instances of the same generator
        const generatorType = generator.generatorType || genName;
        const priority = generator.priority || DEFAULT_PRIORITY;
        const generatorFactory = yield* Effect.promise(() => getGeneratorManager().findGeneratorFactory(generatorType, basePath));
        const generatorSettings = yield* pipe(
          {
            ...generator,
            priority,
            generatorType,
          },
          S.decodeUnknown(generatorFactory.schema, { onExcessProperty: "preserve" }),
          Effect.mapError((err) => new GeneratorConfigError(genName, err)),
        );
        return generatorSettings;
      }),
    ),
  );
  return pipe(
    Effect.all(tasks),
    Effect.andThen((generators) => ({
      ...config,
      basePath,
      generators,
    })),
  );
}

type Overrides = Omit<Partial<Settings>, "generators">;

export function loadConfig(
  path: string,
  overrides: Overrides,
  // TODO: Use a single englobing error here. (I Think ErrorLoadingConfig)
): Effect.Effect<Settings, ConfigFileError | ErrorParsingConfigFile | ErrorLoadingConfig> {
  // Find the closest config file
  return Effect.gen(function* () {
    const fileConfig = yield* readAndValidateConfigFile(path);
    const config = {
      ...fileConfig,
      ...overrides,
    };

    const configWithGenerators = yield* validateGenerators(config);

    const finalConfig = yield* Effect.mapError(
      S.decodeUnknown(settingsSchema)(configWithGenerators, { onExcessProperty: "preserve" }),
      (err) => new ErrorLoadingConfig(err),
    );
    return finalConfig;
  });
}

// TODO: Improve these errors
class ErrorParsingConfigFile {
  _tag = "ErrorParsingConfigFile";
  constructor(public err: ParseError) {}
  explain() {
    return `Error parsing the config file: ${this.err.message}`;
  }
}

class ConfigFileError {
  _tag = "ConfigFileError";
  constructor(public err: string) {}
  explain() {
    return `Error reading the config file: ${this.err}`;
  }
}

class GeneratorConfigError {
  _tag = "GeneratorConfigError";
  constructor(
    public name: string,
    public err: ParseError,
  ) {}
  explain() {
    return `Invalid configuration for generator type "${this.name}": ${this.err.message}`;
  }
}

export class ErrorLoadingConfig {
  type = "ErrorLoadingConfig";
  constructor(private error: string | ParseError | GeneratorConfigError) {}

  explain() {
    let ans = `There was a problem loading the settings: `;
    const error = this.error;
    if (typeof error === "string") {
      ans += error;
    } else if (error instanceof ParseError) {
      ans += error.message;
    } else if (error instanceof GeneratorConfigError) {
      ans += error.explain();
    } else {
      ans += "\n" + renderError(error);
    }
    return ans;
  }
}
