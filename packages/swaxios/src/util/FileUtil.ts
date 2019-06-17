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

import axios from 'axios';
import {isCI} from 'ci-info';
import {getYesNo} from 'cli-interact';
import fs from 'fs-extra';
import logdown from 'logdown';
import path from 'path';
import {Spec} from 'swagger-schema-official';
import yaml from 'yamljs';

import {GeneratedClient} from '../Swaxios';

const logger = logdown('swaxios/FileUtil', {
  logger: console,
  markdown: false,
});

export async function readInputFile(inputFile: string): Promise<Spec> {
  let swaggerJson: Spec;

  logger.info(`Reading OpenAPI specification from file "${inputFile}" ...`);

  try {
    await fs.access(inputFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file "${inputFile}" could not be found or is not readable`);
    }
    throw error;
  }

  try {
    swaggerJson = await fs.readJson(inputFile);
  } catch (error) {
    try {
      swaggerJson = yaml.load(inputFile);
    } catch (error) {
      throw new Error(`Input file "${inputFile}" is neither valid JSON nor valid YAML.`);
    }
  }

  return swaggerJson;
}

export async function readInputURL(inputUrl: string): Promise<Spec> {
  logger.info(`Reading OpenAPI specification from URL "${inputUrl}" ...`);
  const {data} = await axios.get<Spec>(inputUrl);
  return data;
}

/**
 * @param outputDirectory Path to output directory for generated TypeScript code
 * @param forceDeletion Force deleting the output directory before generating
 */
export async function checkOutputDirectory(outputDirectory: string, forceDeletion?: boolean): Promise<string> {
  const resolvedDir = path.resolve(outputDirectory);
  const directoryExists = await fs.pathExists(resolvedDir);

  function shouldDelete(): boolean {
    const question = `The output directory "${resolvedDir}" exists already. Would you like to delete it?\nNOTE: Without deletion, Swaxios can generate unexpected results.`;
    return forceDeletion || (!isCI && getYesNo(question));
  }

  if (directoryExists) {
    if (shouldDelete()) {
      logger.info(`Deleting "${resolvedDir}" ...`);
      await fs.remove(resolvedDir);
    } else if (isCI) {
      throw new Error(`Output directory "${resolvedDir}" exists already`);
    }
  }

  return resolvedDir;
}

interface WriteOptions {
  forceDeletion?: boolean;
  singleFiles?: boolean;
}

export async function writeClient(
  client: GeneratedClient,
  outputDirectory: string,
  options: WriteOptions = {}
): Promise<string> {
  const resolvedOutput = await checkOutputDirectory(outputDirectory, options.forceDeletion);
  const {interfaces} = client;
  // const {classes, interfaces, indices: indexFiles} = client;

  // for (const [filePath, content] of Object.entries(classes)) {
  //   const fullPath = path.join(resolvedOutput, `${filePath}.ts`);
  //   await fs.ensureDir(path.dirname(fullPath));
  //   await fs.outputFile(fullPath, content, 'utf-8');
  // }

  if (!options.singleFiles) {
    for (const [filePath, content] of Object.entries(interfaces)) {
      const fullPath = path.join(resolvedOutput, `${filePath}.ts`);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.outputFile(fullPath, content, 'utf-8');
    }
  } else {
    const fullPath = path.join(resolvedOutput, 'interfaces.ts');
    await fs.ensureDir(path.dirname(fullPath));
    const content = Object.values(interfaces).join('\n');
    await fs.outputFile(fullPath, content, 'utf-8');
  }

  // for (const [filePath, content] of Object.entries(indexFiles)) {
  //   const fullPath = path.join(resolvedOutput, `${filePath}.ts`);
  //   await fs.ensureDir(path.dirname(fullPath));
  //   await fs.outputFile(fullPath, content, 'utf-8');
  // }

  return resolvedOutput;
}
