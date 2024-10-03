import { Task, UnknownError } from "@ts-task/task";
import { arrOf, bool, Contract, num, objOf, str } from "parmenides";
import { BaseGeneratorSettings, Settings } from "../../config.js";
import { Metadata } from "../../metadata-manager.js";
import { fromUnknown } from "../../utils/parmenides/from-unknown.js";
import { tap } from "../../utils/tap.js";
import { copyDir } from "../../utils/ts-task-fs-utils/copy-dir.js";
import { writeFileCreateDir } from "../../utils/ts-task-fs-utils/write-file-create-dir.js";
import colors from "colors";
// @ts-expect-error: Check if ECT has types or if it is a better alternative
import ECT from "ect";
const settingsContract: Contract<CustomGeneratorSettings> = objOf({
  generatorType: str,
  priority: num,
  templateDir: str,
  outputDir: str,
  copyAssets: bool,
  files: arrOf(str),
});

interface CustomGeneratorSettings extends BaseGeneratorSettings {
  templateDir: string;
  outputDir: string;
  copyAssets: boolean;
  files: string[];
}

export default {
  createGenerator: function (metadata: Metadata, projectSettings: Settings, generatorSettings: unknown) {
    return new CustomGenerator(fromUnknown(settingsContract)(generatorSettings));
  },
  contract: settingsContract,
};

const { green, grey } = colors;

interface HtmlWriterFileOptions {
  inputFile: string;
  outputFile: string;
  renderer: any;
}

class HtmlWriterFile {
  inputFile: string;
  outputFile: string;
  renderer: any;
  helpers: unknown;

  constructor(options: HtmlWriterFileOptions) {
    // TODO: This shouldnt be necesary here, it should be cached way above
    if (!("inputFile" in options)) {
      throw new Error("You need to specify an input file");
    }
    if (!("outputFile" in options)) {
      throw new Error("You need to specify an output file");
    }

    this.inputFile = options.inputFile;
    this.outputFile = options.outputFile;
    this.renderer = options.renderer;
  }

  setHelpers(helpers: unknown) {
    this.helpers = helpers;
  }

  render() {
    const self = this;
    return Task.resolve(this)
      .map(({ inputFile, helpers }) => this.renderer.render(inputFile, { mddoc: helpers }))
      .chain((html) => writeFileCreateDir(self.outputFile, html))
      .map(tap((_) => console.log(green("We wrote ") + grey(self.outputFile))));
  }
}

class CustomGenerator {
  renderer: any;

  constructor(private generatorSettings: CustomGeneratorSettings) {
    // TODO: this should be in the HtmlWriterFile, but i dont want to create
    // one every time
    this.renderer = ECT({ root: generatorSettings.templateDir });
  }

  copyAssets() {
    const inputDir = this.generatorSettings.templateDir;
    const outputDir = this.generatorSettings.outputDir;
    // Not sure about the partials one...
    const assetRe = /\/(css|js|images|fonts)\//;

    return copyDir(inputDir, outputDir, assetRe);
  }

  generate(helpers: unknown) {
    const self = this;
    const tasks: Task<unknown, NodeJS.ErrnoException | UnknownError>[] = [];

    if (self.generatorSettings.copyAssets) {
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

    return Task.all(tasks);
  }
}
