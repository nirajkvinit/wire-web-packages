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

import {Schema} from 'swagger-schema-official';
import {SwaxiosInterface, SwaxiosInterfaceValue} from '../definitions';
import {TypeGenerator} from './TypeBuilder';

export class InterfaceGenerator {
  private readonly schema: Omit<Schema, '$ref' | 'enum'>;
  private readonly name: string;
  private readonly typeGenerator: TypeGenerator;

  constructor(name: string, schema: Omit<Schema, '$ref' | 'enum'>) {
    this.name = name;
    this.schema = schema;
    this.typeGenerator = new TypeGenerator();
  }

  private isOptional(keyName: string): boolean {
    if (this.schema.required) {
      return !this.schema.required.includes(keyName);
    }
    return true;
  }

  private buildValues(): SwaxiosInterfaceValue[] {
    if (!this.schema.properties) {
      return [];
    }

    return Object.entries(this.schema.properties).map(([key, value]) => {
      return {
        description: value.description,
        name: key,
        optional: this.isOptional(key),
        type: this.typeGenerator.buildType(value.type),
      };
    });
  }

  public buildInterface(): SwaxiosInterface {
    const result: SwaxiosInterface = {
      name: this.name,
      values: this.buildValues(),
    };

    if (this.schema.description) {
      result.description = this.schema.description;
    }

    return result;
  }
}
