import { ParseError } from "@effect/schema/ParseResult";
import { Schema } from "@effect/schema/Schema";
import * as S from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import * as R from "effect/Record";

import { getGeneratorManager } from "./generator/generator-manager.js";
import { decodeUnknownOrError } from "./utils/effect/decode.js";
import { toEffect } from "./utils/effect/ts-task.js";
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

interface ConfigFileSettings extends Schema.Type<typeof configFileSettings> {}

type _ConfigFileWithDefaults = Omit<ConfigFileSettings, "basePath" | "generators"> & {
  basePath: string;
  generators: NonNullable<ConfigFileSettings["generators"]>;
};
interface ConfigFileWithDefaults extends _ConfigFileWithDefaults {}

// Find the closest config file
function findConfigFile(path: string) {
  return pipe(
    toEffect(findup(path, "Mddocfile.js")),
    Effect.mapError((_) => new ImportConfigFileError("Could not find Mddocfile.js")),
  );
}

function importConfigFile(dir: string) {
  const configFile = dir + "/Mddocfile.js";
  return Effect.tryPromise({
    try: () => import(configFile).then((x) => x.default() as unknown),
    catch: (err) => new ImportConfigFileError(err instanceof Error ? err.message : "Unknown error"),
  });
}

function validateConfigFile(config: unknown): Effect.Effect<ConfigFileWithDefaults, ErrorValidatingConfigFile> {
  return pipe(
    config,
    decodeUnknownOrError({
      schema: configFileSettings,
      options: { onExcessProperty: "preserve" },
      onError: (err) => new ErrorValidatingConfigFile(err),
    }),
    // Remove nullable fields by providing sensible defaults.
    Effect.map((validatedConfig) => ({
      ...validatedConfig,
      basePath: validatedConfig.basePath ?? process.cwd(),
      generators: validatedConfig.generators ?? {},
    })),
  );
}

function readAndValidateConfigFile(
  path: string,
): Effect.Effect<ConfigFileWithDefaults, ErrorValidatingConfigFile | ImportConfigFileError> {
  return pipe(
    findConfigFile(path),
    Effect.andThen((path) => importConfigFile(path)),
    Effect.andThen((configFile) => validateConfigFile(configFile)),
  );
}

function validateGenerators(config: ConfigFileWithDefaults) {
  const basePath = config.basePath;
  const generators = config.generators;

  const tasks = pipe(
    generators,
    R.map((generator, genName) =>
      Effect.gen(function* () {
        // By default, the generator type is the name, but you can override it in the options
        // In case you want to have two instances of the same generator
        const generatorType = generator.generatorType ?? genName;
        const priority = generator.priority ?? DEFAULT_PRIORITY;
        const generatorFactory = yield* Effect.promise(() => getGeneratorManager().findGeneratorFactory(generatorType, basePath));
        const generatorWithDefaults = {
          ...generator,
          priority,
          generatorType,
        };
        return yield* decodeUnknownOrError({
          schema: generatorFactory.schema,
          options: { onExcessProperty: "error" },
          onError: (err) => new GeneratorConfigError(genName, err),
        })(generatorWithDefaults);
      }),
    ),
  );
  return pipe(
    Effect.all(tasks),
    Effect.map((generators) => ({
      ...config,
      basePath,
      generators,
    })),
  );
}

type Overrides = Omit<Partial<Settings>, "generators">;

export function loadConfig(path: string, overrides: Overrides): Effect.Effect<Settings, ErrorLoadingConfig> {
  // Find the closest config file
  return pipe(
    Effect.gen(function* () {
      const fileConfig = yield* readAndValidateConfigFile(path);
      const config = {
        ...fileConfig,
        ...overrides,
      };

      const configWithGenerators = yield* validateGenerators(config);
      return yield* decodeUnknownOrError({
        schema: settingsSchema,
        options: { onExcessProperty: "preserve" },
        onError: (err) => new FinalSettingsError(err),
      })(configWithGenerators);
    }),
    Effect.mapError((err) => new ErrorLoadingConfig(err)),
  );
}

class ErrorValidatingConfigFile {
  _tag = "ErrorValidatingConfigFile";
  constructor(public err: ParseError) {}
  explain() {
    return `The config file is invalid: ${this.err.message}`;
  }
}

class ImportConfigFileError {
  _tag = "ImportConfigFileError";
  constructor(public err: string) {}
  explain() {
    return `The config file could not be read: ${this.err}`;
  }
}

class GeneratorConfigError {
  _tag = "GeneratorConfigError";
  constructor(
    public generatorName: string,
    public err: ParseError,
  ) {}
  explain() {
    return `Invalid configuration for generator type "${this.generatorName}": ${this.err.message}`;
  }
}

class FinalSettingsError {
  _tag = "FinalSettingsError";
  constructor(public err: ParseError) {}
  explain() {
    return `The settings combined from the config file and the cli arguments are invalid: ${this.err.message}`;
  }
}

export class ErrorLoadingConfig {
  type = "ErrorLoadingConfig";
  constructor(private error: GeneratorConfigError | ImportConfigFileError | ErrorValidatingConfigFile | FinalSettingsError) {}

  explain() {
    return `There was a problem loading the settings: ${this.error.explain()} `;
  }
}
