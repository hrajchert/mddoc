import * as path from "path";

import { Schema } from "@effect/schema/Schema";
import * as Eff from "effect/Effect";
import { Effect } from "effect/Effect";

import { BaseGeneratorSettings, Settings } from "../config.js";
import { Metadata } from "../metadata/metadata.js";
import { Explainable } from "../utils/explain.js";

import * as GeneratorHelperManager from "./generator-helper-manager.js";

export interface Generator {
  generate: (helpers?: unknown) => Effect<void, Explainable>;
}

// TODO: Move to a plugin interface file.
interface GeneratorFactory {
  /**
   * Method to create a Generator
   */
  createGenerator: (metadata: Metadata, projectSettings: Settings, generatorSettings: unknown) => Generator;

  /**
   * Schema to see if the generator settings are the correct ones
   */
  schema: Schema<BaseGeneratorSettings>;
}

/**
 * Available generators
 */
const registeredGenerators: { [name: string]: GeneratorFactory } = {};

export async function registerGenerator(name: string, genpath: string) {
  // TODO: use a logger
  console.debug("registering generator", name, genpath);
  const module = await import(genpath);
  const factory: GeneratorFactory = module.default;

  if (!("createGenerator" in factory)) {
    throw new Error(`Module ${genpath} doesn't have a createGenerator exported`);
  }

  registeredGenerators[name] = factory;

  return factory;
}

/**
 * Make the path absolute. If it was relative, make it from the project base path
 */
function normalizeProjectGeneratorPath(genpath: string, basePath: string) {
  let ans = path.normalize(genpath);
  if (ans[0] !== "/") {
    ans = path.join(basePath, ans);
  }
  return ans;
}

export class GeneratorManager {
  generators: Array<{
    generatorObject: Generator;
    generatorSettings: BaseGeneratorSettings;
    generatorName: string;
  }> = [];

  metadata: Metadata | null = null;
  initialized = false;

  async findGeneratorFactory(generatorType: string, basePath: string) {
    let generator, genpath;
    // If it's already registered, cool
    if (generatorType in registeredGenerators) {
      generator = registeredGenerators[generatorType];
    }
    // If not, try to see if there is a npm dependency with that name
    else {
      genpath = normalizeProjectGeneratorPath(`./node_modules/${generatorType}`, basePath);
      try {
        generator = await registerGenerator(generatorType, genpath);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error && err.message.includes(genpath)) {
          throw new Error(`Generator ${generatorType} not defined`);
        } else {
          throw err;
        }
      }
    }
    return generator;
  }

  async initialize(metadata: Metadata, projectSettings: Settings) {
    // Avoid duplicate initialization
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.metadata = metadata;
    // Instantiate all generators
    for (const generatorName in projectSettings.generators) {
      // Get the generator settings
      const generatorSettings = projectSettings.generators[generatorName];

      // Find the constructor
      const generatorFactory = await this.findGeneratorFactory(generatorSettings.generatorType, projectSettings.basePath);

      // Instantiate it
      const generatorObject = generatorFactory.createGenerator(metadata, projectSettings, generatorSettings);

      // Add it to the generator instance list
      this.generators.push({
        generatorObject,
        generatorSettings,
        generatorName,
      });
    }
    // Sort them by priority
    this.generators.sort((a, b) => b.generatorSettings.priority - a.generatorSettings.priority);
  }

  generate() {
    const self = this;
    return Eff.gen(function* () {
      const steps = self.generators.map((generator) =>
        Eff.gen(function* () {
          if (self.metadata === null) {
            return yield* Eff.die("metadata shouldnt be null");
          }
          const helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
          return yield* generator.generatorObject.generate(helpers);
        }),
      );

      return yield* Eff.all(steps);
    });
  }
}

const singleton = new GeneratorManager();
export function getGeneratorManager() {
  return singleton;
}

// Use dynamic imports for registering generators
await registerGenerator("custom", new URL("./custom/custom-generator.js", import.meta.url).pathname);
await registerGenerator("html-fragment", new URL("./html-fragment/html-fragment-generator.js", import.meta.url).pathname);
