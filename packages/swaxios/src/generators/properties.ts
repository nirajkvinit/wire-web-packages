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

import {Parameter} from 'swagger-schema-official';

export enum TypeScriptType {
  ANY = 'any',
  ARRAY = 'Array',
  EMPTY_OBJECT = '{}',
  INTERFACE = 'interface',
  NUMBER = 'number',
  STRING = 'string',
  TYPE = 'type',
}

export interface StringType {
  type: 'string';
}

export function generateType(data: StringType): string {
  return `: ${data.type}`;
}

export function generateParameter(data: Parameter): string {
  const description = data.description ? `/** ${data.description} */\n` : '';
  const required = data.required ? '' : '?';
  const type: string = 'type' in data ? data.type : TypeScriptType.ANY;
  return `${description}${data.name}${required}: ${type}`;
}
