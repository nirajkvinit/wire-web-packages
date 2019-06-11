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

import {ClassesGenerator, ClientClass, ClientInterface, ClientTypeValue, InterfacesGenerator, MainGenerator} from '.';

export type Index = ClientClass | ClientTypeValue | ClientInterface | string;

export class IndexGenerator {
  private readonly classes: ClassesGenerator;
  private readonly interfaces: InterfacesGenerator;
  private readonly main: MainGenerator;

  /** [path, data] */
  indexFiles: Record<string, Index[]>;

  constructor(interfaces: InterfacesGenerator, classes: ClassesGenerator, main: MainGenerator) {
    this.classes = classes;
    this.interfaces = interfaces;
    this.main = main;

    this.indexFiles = {};

    this.buildIndex();
  }

  private buildIndex(): void {
    this.indexFiles['/interfaces'] = this.interfaces.getValues();
    this.indexFiles['/'] = [this.main.fileName];

    for (const clientClass of this.classes.getValues()) {
      this.indexFiles[clientClass.dirName] = [...this.indexFiles[clientClass.dirName], clientClass];
    }
  }

  getValues(): Index[][] {
    return Object.values(this.indexFiles);
  }

  getByPath(path: string): Index[] | void {
    return this.indexFiles[path];
  }
}
