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

export function titleCase(word: string): string {
  return `${word[0].toUpperCase()}${word.slice(1)}`;
}

export function pascalCase(words: string[]): string {
  return words.map(titleCase).join('');
}

export function camelCase(words: string[]): string {
  if (!words.length) {
    return '';
  }
  if (words.length === 1) {
    return words[0].toLowerCase();
  }
  const firstWord = words.shift() as string;
  const otherWords = words.map(titleCase).join('');
  return `${firstWord}${otherWords}`;
}
