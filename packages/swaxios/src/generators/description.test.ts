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

import {generateDescription} from './description';

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
