import * as S from "@effect/schema/Schema";
import { Schema } from "@effect/schema/Schema";
import { pipe, Data } from "effect";
import * as Eff from "effect/Effect";
// @ts-expect-error TODO: Update markdown to markdown-it or similar
import { markdown } from "markdown";

import { BaseGeneratorSettings, Settings } from "../../config.js";
import { Metadata } from "../../metadata/metadata.js";
import { fromUnknownWithSchema } from "../../utils/effect/from-unknown.js";
import { writeFileCreateDir } from "../../utils/ts-task-fs-utils/write-file-create-dir.js";
import { Generator } from "../generator-manager.js";

const settingsSchema: Schema<HtmlFragmentGeneratorSettings> = S.Struct({
  outputDir: S.String,
  priority: S.Number,
  generatorType: S.String,
});

interface HtmlFragmentGeneratorSettings extends BaseGeneratorSettings {
  outputDir: string;
}

export default {
  createGenerator: function (metadata: Metadata, projectSettings: Settings, generatorSettings: unknown) {
    // TODO: Use Effect to remove fromUnknownWithSchema
    return new HtmlFragmentGenerator(metadata, projectSettings, fromUnknownWithSchema(settingsSchema)(generatorSettings));
  },
  schema: settingsSchema,
};

export class HtmlFragmentGenerator implements Generator {
  constructor(
    private metadata: Metadata,
    projectSettings: Settings,
    private generatorSettings: HtmlFragmentGeneratorSettings,
  ) {}
  generate() {
    const self = this;
    return Eff.gen(function* () {
      // const tasks: ReturnType<typeof writeFileCreateDir>[] = [];

      self.metadata.renderedFragments = {};
      // For each markdown, create the html fragment
      const tasks = Object.entries(self.metadata.jsonml).map(([mdTemplateName, mdTemplateFile]) =>
        Eff.gen(function* () {
          const html = yield* Eff.try({
            try: () => {
              const tree = markdown.toHTMLTree(mdTemplateFile);
              return markdown.renderJsonML(tree);
            },
            catch: (err) => new RenderHtmlFragmentError({ err, templateName: mdTemplateName }),
          });
          const outputFilename = self.generatorSettings.outputDir + "/" + mdTemplateName + ".html";
          // mhmhmh TODO: This is sooo hardcoded
          // @ts-expect-error renderedFragments is possibly undefined, improve this
          self.metadata.renderedFragments[mdTemplateName] = "fragment/" + mdTemplateName + ".html";
          yield* writeFileCreateDir(outputFilename, html);
        }),
      );

      return yield* pipe(Eff.all(tasks), Eff.asVoid);
    });
  }
}

class RenderHtmlFragmentError extends Data.TaggedError("RenderHtmlFragmentError")<{ templateName: string; err: unknown }> {
  explain() {
    const reason = this.err instanceof Error ? this.err.message : String(this.err);
    return `Could not render ${this.templateName}: ${reason}`;
  }
}
