import { Task } from "@ts-task/task";
import { BaseGeneratorSettings, Settings } from "../../config.js";
import { Metadata } from "../../metadata/metadata.js";
import { fromUnknownWithSchema } from "../../utils/effect/from-unknown.js";
import { writeFileCreateDir } from "../../utils/ts-task-fs-utils/write-file-create-dir.js";
import colors from "colors";
import * as S from "@effect/schema/Schema";
import { Schema } from "@effect/schema/Schema";

// TODO: remove
// @ts-expect-error TODO: Update markdown to markdown-it or similar
import { markdown } from "markdown";
// TODO: remove and use something like @effect/printer
const { red } = colors;

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

export class HtmlFragmentGenerator {
  constructor(
    private metadata: Metadata,
    projectSettings: Settings,
    private generatorSettings: HtmlFragmentGeneratorSettings,
  ) {}
  generate() {
    const self = this;
    const tasks: ReturnType<typeof writeFileCreateDir>[] = [];

    self.metadata.renderedFragments = {};
    // For each markdown, create the html fragment
    for (const mdTemplate in self.metadata.jsonml) {
      try {
        const tree = markdown.toHTMLTree(self.metadata.jsonml[mdTemplate]);
        const html = markdown.renderJsonML(tree);

        const outputFilename = self.generatorSettings.outputDir + "/" + mdTemplate + ".html";
        // mhmhmh TODO: This is sooo hardcoded
        self.metadata.renderedFragments[mdTemplate] = "fragment/" + mdTemplate + ".html";

        tasks.push(writeFileCreateDir(outputFilename, html));
      } catch (e) {
        // TODO: Catch this better
        console.log(red("Problem with ") + mdTemplate);
        throw e;
      }
    }

    return Task.all(tasks);
  }
}
