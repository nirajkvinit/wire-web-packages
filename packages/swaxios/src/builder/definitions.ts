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

import * as ts from 'typescript';

export interface SwaxiosConstructor extends SwaxiosFunction {
  async: false;
  constructor: true;
  name: 'constructor';
  returnType: ts.SyntaxKind.ThisKeyword;
}

export interface SwaxiosGetter extends SwaxiosFunction {
  getter: true;
}

export interface SwaxiosSetter extends SwaxiosFunction {
  setter: true;
}

export interface SwaxiosArgument {
  name: string;
  required?: boolean;
  type: SwaxiosType | SwaxiosFunction;
}

export interface SwaxiosFunction {
  arguments?: SwaxiosArgument;
  async?: boolean;
  content?: SwaxiosFunctionContent;
  description?: string;
  name: string;
  private?: boolean;
  returnType: ts.SyntaxKind;
  static?: boolean;
}

export interface SwaxiosClassValue extends SwaxiosInterfaceValue {
  private?: boolean;
  readonly?: boolean;
  static?: boolean;
}

export interface SwaxiosInterfaceValue {
  description?: string;
  name: string;
  required?: boolean;
  type: ts.SyntaxKind;
}

export interface SwaxiosClass {
  description?: string;
  constructor: SwaxiosConstructor;
  functions?: SwaxiosFunction[];
  getter?: SwaxiosGetter[];
  name: string;
  setter?: SwaxiosSetter[];
  values?: Record<string, SwaxiosClassValue>;
}

export interface SwaxiosInterface {
  description?: string;
  name: string;
  values: Record<string, SwaxiosInterfaceValue>;
}

export interface SwaxiosType {
  description?: string;
  name: string;
  type: ts.SyntaxKind;
}

export type SwaxiosFunctionContent = string;

export interface Swaxios {
  classes?: SwaxiosClass[];
  interfaces?: SwaxiosInterface[];
  mainClass: SwaxiosClass;
}
