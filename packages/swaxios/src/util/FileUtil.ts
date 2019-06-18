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

import {isCI} from 'ci-info';
import {getYesNo} from 'cli-interact';
import * as fs from 'fs-extra';
import {Spec} from 'swagger-schema-official';

import * as ParseUtil from './ParseUtil';

export async function checkOutputDirectory(outputDirectory: string, forceDeletion?: boolean): Promise<boolean> {
  const directoryExists = await fs.pathExists(outputDirectory);
  function shouldDelete(): boolean {
    const question = `The output directory "${outputDirectory}" exists already. Would you like to delete it to continue?`;
    return forceDeletion || (!isCI && getYesNo(question));
  }

  if (directoryExists) {
    if (shouldDelete()) {
      console.info(`Deleting "${outputDirectory}" ...`);
      await fs.remove(outputDirectory);
      return true;
    }

    if (isCI) {
      throw new Error(`Output directory "${outputDirectory}" exists already`);
    }

    return false;
  }

  return true;
}

export async function readInputFile(inputFile: string): Promise<Spec> {
  console.log(`Reading OpenAPI specification from file "${inputFile}" ...`);

  try {
    const data = await fs.readFile(inputFile, 'utf-8');
    return ParseUtil.parseInputFile(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file "${inputFile}" could not be found or is not readable`);
    }
    throw error;
  }
}
