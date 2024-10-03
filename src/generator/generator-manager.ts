import { Task, UnknownError } from "@ts-task/task";
import { BaseGeneratorSettings, Settings } from "../config.js";
import { Metadata } from "../metadata-manager.js";

import * as path from "path";
import { sequence } from "../utils/ts-task-utils/sequence.js";

import { Contract } from "parmenides";
import * as GeneratorHelperManager from "./generator-helper-manager.js";
import { FixAnyTypeScriptVersion } from "../utils/typescript.js";

interface Generator {
  generate: (helpers?: unknown) => Task<void, UnknownError>;
}

interface GeneratorFactory {
  /**
   * Method to create a Generator
   */
  createGenerator: Function;

  /**
   * Contract to see if the generator settings are the correct ones
   */
  contract: Contract<BaseGeneratorSettings>;
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
        console.log("findGeneratorFactory", generatorType, genpath);
        generator = await registerGenerator(generatorType, genpath);
      } catch (err: FixAnyTypeScriptVersion) {
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
    const steps = self.generators.map((generator) => () => {
      if (self.metadata === null) throw "metadata shouldnt be null";
      const helpers = GeneratorHelperManager.getRenderHelpers(self.metadata);
      console.log("Executing the generator: " + generator.generatorName);
      return generator.generatorObject.generate(helpers);
    });
    return sequence(steps);
  }
}

const singleton = new GeneratorManager();
export function getGeneratorManager() {
  return singleton;
}

// Use dynamic imports for registering generators
await registerGenerator("custom", new URL("./custom/custom-generator.js", import.meta.url).pathname);
await registerGenerator("html-fragment", new URL("./html-fragment/html-fragment-generator.js", import.meta.url).pathname);
