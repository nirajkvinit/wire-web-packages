#!/usr/bin/env node

/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import program from 'commander';

import {generateFiles, readSpec, writeClient} from './Swaxios';

const {bin, description, name, version} = require('../package.json');
const binName = Object.keys(bin)[0] || name;

program
  .name(binName)
  .description(description)
  .version(version, '-v, --version')
  .option('-i, --input <file>', 'File path (or URL) to OpenAPI Specification, i.e. swagger.json (required)')
  .option('-o, --output <directory>', 'Path to output directory for generated TypeScript code (required)')
  .option('-f, --force', 'Force deleting the output directory before generating')
  .parse(process.argv);

if (!program.input || !program.output) {
  program.outputHelp();
  process.exit(1);
}

readSpec(program.input)
  .then(spec => generateFiles(spec))
  .then(client => writeClient(client, program.output, program.force))
  .then(outputDir => console.log(`Created API client in "${outputDir}".`))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
