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

import * as path from 'path';
import * as SwaggerParser from 'swagger-parser';
import {Spec} from 'swagger-schema-official';

import {Builder} from './parser/Builder';
import {FileUtil, UrlUtil} from './util/';

export interface Options {
  forceDeletion?: boolean;
  inputFile: string;
  outputDir: string;
  separateFiles?: boolean;
}

export class Swaxios {
  private readonly forceDeletion?: boolean;
  private readonly inputFile: string;
  private readonly outputDir: string;
  private readonly separateFiles?: boolean;

  constructor(options: Options) {
    this.forceDeletion = options.forceDeletion;
    this.inputFile = path.resolve(options.inputFile);
    this.outputDir = path.resolve(options.outputDir);
    this.separateFiles = options.separateFiles;
  }

  private async validateConfig(swaggerJson: Spec): Promise<void> {
    await SwaggerParser.validate(swaggerJson);
  }

  async writeClient(): Promise<string | null> {
    const outputClean = await FileUtil.checkOutputDirectory(this.outputDir, this.forceDeletion);
    if (!outputClean) {
      return null;
    }

    const isUrl = /^(https?|ftps?):\/\//.test(this.inputFile);
    const specification = isUrl
      ? await UrlUtil.readInputUrl(this.inputFile)
      : await FileUtil.readInputFile(this.inputFile);
    await this.validateConfig(specification);

    await new Builder(specification, this.outputDir, this.separateFiles).save();

    return this.outputDir;
  }
}
