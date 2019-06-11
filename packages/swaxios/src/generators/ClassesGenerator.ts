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

import {Spec} from 'swagger-schema-official';

import {ClientValue} from '../ClientValue';
import {InterfacesGenerator} from './InterfacesGenerator';

export interface ClientClass {
  dirName: string;
  fileName: string;
  name: string;
  values: ClientValue[];
}

export class ClassesGenerator {
  readonly specification: Spec;
  readonly interfaces: InterfacesGenerator;

  classes: Map<string, ClientClass>;

  constructor(specification: Spec, interfaces: InterfacesGenerator) {
    this.specification = specification;
    this.interfaces = interfaces;
    this.classes = new Map();
  }

  getValues(): ClientClass[] {
    return Array.from(this.classes.values());
  }

  getKeys(): string[] {
    return Array.from(this.classes.keys());
  }

  getByName(name: string): ClientClass | void {
    return this.classes.get(name);
  }
}
