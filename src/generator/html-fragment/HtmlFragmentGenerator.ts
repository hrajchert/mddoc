import { Metadata } from "../../MetadataManager";
import { Settings, BaseGeneratorSettings } from "../../config";
import { objOf, str, Contract, num } from "parmenides";
import { Task } from "@ts-task/task";
import { writeFileCreateDir } from "../../utils/ts-task-fs-utils/writeFileCreateDir";
import { fromUnknown } from "../../utils/parmenides/from-unknown";

// TODO: remove
var markdown = require("markdown").markdown;
const { red } = require("colors");

const settingsContract: Contract<HtmlFragmentGeneratorSettings> = (objOf({
    outputDir: str,
    priority: num,
    generatorType: str
}));

interface HtmlFragmentGeneratorSettings extends BaseGeneratorSettings {
    outputDir: string;
}

export default {
    createGenerator : function (metadata: Metadata, projectSettings: Settings, generatorSettings: unknown) {
        return new HtmlFragmentGenerator(metadata, projectSettings, fromUnknown(settingsContract)(generatorSettings));
    },
    contract: settingsContract
}




export class HtmlFragmentGenerator {
    constructor (private metadata: Metadata, private projectSettings: Settings, private generatorSettings: HtmlFragmentGeneratorSettings) {
    }
    generate () {
        const self = this;
        const tasks: ReturnType<typeof writeFileCreateDir>[] = [];

        self.metadata.renderedFragments = {};

        // For each markdown, create the html fragment
        for (let mdTemplate in self.metadata.jsonml) {
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
    };
};




