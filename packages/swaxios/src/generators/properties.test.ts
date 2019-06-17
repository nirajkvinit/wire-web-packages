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

import * as fs from 'fs-extra';
import * as path from 'path';
import {ParameterType} from 'swagger-schema-official';

import {generateSimpleType} from './properties';

const snippetsDir = path.resolve(__dirname, '../../snippets');
const propertiesDir = path.join(snippetsDir, 'definitions/properties');

describe('generateSimpleType', () => {
  it('generates a string', async () => {
    const {type}: {type: ParameterType} = await fs.readJSON(path.join(propertiesDir, 'string.json'));
    const expected = 'string';
    const actual = generateSimpleType(type);
    expect(actual).toBe(expected);
  });

  it('generates a boolean', async () => {
    const {type}: {type: ParameterType} = await fs.readJSON(path.join(propertiesDir, 'boolean.json'));
    const expected = 'boolean';
    const actual = generateSimpleType(type);
    expect(actual).toBe(expected);
  });

  it('generates a number from integer', async () => {
    const {type}: {type: ParameterType} = await fs.readJSON(path.join(propertiesDir, 'integer.json'));
    const expected = 'number';
    const actual = generateSimpleType(type);
    expect(actual).toBe(expected);
  });
});
