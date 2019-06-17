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

import {NoBodyParameter, generateDescription, generateProperty, generateSimpleType} from './properties';

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

describe('generateParameter', () => {
  it('generates a string property', async () => {
    const data: NoBodyParameter = await fs.readJSON(path.join(propertiesDir, 'string.json'));
    const expected = `name?: string`;
    const actual = generateProperty(data);
    expect(actual).toBe(expected);
  });

  it('generates a required string property', async () => {
    const data: NoBodyParameter = await fs.readJSON(path.join(propertiesDir, 'string-required.json'));
    const expected = `name: string`;
    const actual = generateProperty(data);
    expect(actual).toBe(expected);
  });

  it('generates a base64 property', async () => {
    const data: NoBodyParameter = await fs.readJSON(path.join(propertiesDir, 'string-format-base64.json'));
    const expected = `/** format: base64 */\ncode?: string`;
    const actual = generateProperty(data);
    expect(actual).toBe(expected);
  });

  it('generates an url property', async () => {
    const data: NoBodyParameter = await fs.readJSON(path.join(propertiesDir, 'string-format-url.json'));
    const expected = `/** Your website (format: url) */\nwebsite?: string`;
    const actual = generateProperty(data);
    expect(actual).toBe(expected);
  });
});

describe('generateDescription', () => {
  it('generates a description without format', async () => {
    const data = {description: 'Your website'};
    const expected = `/** Your website */\n`;
    const actual = generateDescription(data);
    expect(actual).toBe(expected);
  });

  it('generates a description with format', async () => {
    const data = {description: 'Your website', format: 'url'};
    const expected = `/** Your website (format: url) */\n`;
    const actual = generateDescription(data);
    expect(actual).toBe(expected);
  });

  it('generates a multi-line description without format', async () => {
    const data = {description: 'Your website\n\nOr any other website'};
    const expected = `/**\n * Your website\n *\n * Or any other website\n */\n`;
    const actual = generateDescription(data);
    expect(actual).toBe(expected);
  });

  it('generates a multi-line description with format', async () => {
    const data = {description: 'Your website\n\nOr any other website', format: 'url'};
    const expected = `/**\n * Your website\n *\n * Or any other website (format: url)\n */\n`;
    const actual = generateDescription(data);
    expect(actual).toBe(expected);
  });
});
