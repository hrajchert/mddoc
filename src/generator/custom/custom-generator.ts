import * as S from "@effect/schema/Schema";
import { Schema } from "@effect/schema/Schema";
import colors from "colors";
// @ts-expect-error: Check if ECT has types or if it is a better alternative
import ECT from "ect";
import { pipe } from "effect";
import * as Eff from "effect/Effect";
import { Effect } from "effect/Effect";

import { BaseGeneratorSettings, Settings } from "../../config.js";
import { Metadata } from "../../metadata/metadata.js";
import { fromUnknownWithSchema } from "../../utils/effect/from-unknown.js";
import { Explainable } from "../../utils/explain.js";
import { copyDir } from "../../utils/ts-task-fs-utils/copy-dir.js";
import { writeFileCreateDir } from "../../utils/ts-task-fs-utils/write-file-create-dir.js";
import { Generator } from "../generator-manager.js";

const settingsSchema: Schema<CustomGeneratorSettings> = S.Struct({
  generatorType: S.String,
  priority: S.Number,
  templateDir: S.String,
  outputDir: S.String,
  copyAssets: S.optional(S.Boolean),
  files: S.Array(S.String),
}).annotations({ title: "CustomGeneratorSettings" });

interface CustomGeneratorSettings extends BaseGeneratorSettings {
  templateDir: string;
  outputDir: string;
  copyAssets?: boolean | undefined;
  files: readonly string[];
}
// TODO: Create an interface for the Plugin type import
export default {
  // TODO: Return Effect so we can avoid `fromUnknownWithSchema`
  createGenerator: function (metadata: Metadata, projectSettings: Settings, generatorSettings: unknown) {
    return new CustomGenerator(fromUnknownWithSchema(settingsSchema)(generatorSettings));
  },
  schema: settingsSchema,
};

const { green, grey } = colors;

// Deduced from the ECT source code. TODO: Change
// https://github.com/baryshev/ect/blob/master/lib/ect.js
type Renderer = {
  render: (template: string, options: unknown) => string;
};

interface HtmlWriterFileOptions {
  inputFile: string;
  outputFile: string;
  renderer: Renderer;
}

class HtmlWriterFile {
  inputFile: string;
  outputFile: string;
  renderer: Renderer;
  helpers: unknown;

  constructor(options: HtmlWriterFileOptions) {
    this.inputFile = options.inputFile;
    this.outputFile = options.outputFile;
    this.renderer = options.renderer;
  }

  setHelpers(helpers: unknown) {
    this.helpers = helpers;
  }

  render() {
    const self = this;
    return Eff.gen(function* () {
      const html = self.renderer.render(self.inputFile, { mddoc: self.helpers });
      yield* writeFileCreateDir(self.outputFile, html);
      console.log(green("We wrote ") + grey(self.outputFile));
    });
  }
}

class CustomGenerator implements Generator {
  renderer: Renderer;

  constructor(private generatorSettings: CustomGeneratorSettings) {
    // TODO: this should be in the HtmlWriterFile, but i dont want to create
    // one every time
    this.renderer = ECT({ root: generatorSettings.templateDir });
  }

  copyAssets() {
    const self = this;
    return Eff.gen(function* () {
      const inputDir = self.generatorSettings.templateDir;
      const outputDir = self.generatorSettings.outputDir;
      // Not sure about the partials one...
      const assetRe = /\/(css|js|images|fonts)\//;

      return yield* copyDir(inputDir, outputDir, assetRe);
    });
  }

  generate(helpers: unknown) {
    const self = this;
    return Eff.gen(function* () {
      const tasks: Effect<unknown, Explainable>[] = [];
      const copyAssets = self.generatorSettings.copyAssets ?? false;
      if (copyAssets) {
        tasks.push(self.copyAssets());
      }

      // TODO: Remove the files settings, probably walk the dir for .tpl files
      for (let i = 0; i < self.generatorSettings.files.length; i++) {
        // Create the object in charge of rendering the html
        const renderObject = new HtmlWriterFile({
          inputFile: self.generatorSettings.files[i] + ".tpl",
          outputFile: self.generatorSettings.outputDir + "/" + self.generatorSettings.files[i] + ".html",
          renderer: self.renderer,
        });

        // ...
        renderObject.setHelpers(helpers);

        // Generate the html
        tasks.push(renderObject.render());
      }

      return yield* pipe(Eff.all(tasks), Eff.asVoid);
    });
  }
}
