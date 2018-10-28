// Having this without comments cause esprima to freak and a weird
//#!/usr/bin/env node

import * as mddoc from './index';
import {loadConfig} from './src/config';
const _       = require("underscore");
const program = require("commander");

// Configure command line options
program
  .version("0.0.2")
  .option("-i, --inputDir [dir]", "Input dir")
  .option("-o, --outputDir [dir]", "Output dir")
  .parse(process.argv);

const commandLineOptions = _.pick(program, "inputDir", "outputDir");

// Set proccess title
process.title = "mddoc";

// Catch unhandled rejected promises
require("pretty-monitor").start();
const PrettyError = require("pretty-error");
const pe = new PrettyError();

PrettyError.start(function() {
    // Load the program options
    loadConfig(process.cwd(), commandLineOptions)
        .chain(settings => {
            // Initialize the mddoc steps
            mddoc.initialize(settings);

            // Indicate which steps to run
            const steps = [
                mddoc.readMarkdown,
                mddoc.readCode,
                mddoc.saveMetadata,
                mddoc.replaceReferences,
                mddoc.generateOutput
            ];

            // Do magic
            return mddoc.run(steps)
        })
        .fork(
            // TODO: Change to Explainable Errors
            error => {
                if (mddoc.isStepError(error)) {
                    console.error(`There was a problem in the step "${error.step}"`);
                    console.error(pe.render(error.err));
                } else if (error instanceof mddoc.LibraryNotInitialized) {
                    console.error(`The library wasnt initialized correctly ${error.module}`);
                }
                else {
                    console.error('Unknown error');
                    console.error(pe.render(error));
                }
            },
            _ => console.log('Program finished')
        );
});
