// #!/usr/bin/env node

import * as mddoc from './index';
import { loadConfig } from './src/config';
import { explain } from './src/utils/explain';
import { sequence } from './src/utils/ts-task-utils/sequence';
const _       = require('underscore');
const program = require('commander');

// Configure command line options
program
  .version('0.0.2')
  .option('-i, --inputDir [dir]', 'Input dir')
  .option('-o, --outputDir [dir]', 'Output dir')
  .parse(process.argv);

const commandLineOptions = _.pick(program, 'inputDir', 'outputDir');

// Set proccess title
process.title = 'mddoc';

// Load the program options
loadConfig(process.cwd(), commandLineOptions)
    .chain(settings => {
        // Initialize the mddoc steps
        const mgr = mddoc.initialize(settings);

        // Indicate which steps to run
        const steps = [
            mddoc.readMarkdown(settings, mgr),
            mddoc.readCode(settings, mgr),
            mddoc.saveMetadata(settings, mgr),
            mddoc.replaceReferences(mgr),
            mddoc.generateOutput,
            mddoc.reportNotFound(mgr)
        ];

        // Run each step
        return sequence(steps);
    })
    .fork(
        error => console.error(explain(error)),
        _ => console.log('Program finished')
    );
