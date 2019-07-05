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

export enum SwaggerType {
  ARRAY = 'array',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}

export enum TypeScriptType {
  ANY = 'any',
  ARRAY = 'Array',
  BOOLEAN = 'boolean',
  EMPTY_OBJECT = '{}',
  FUNCTION = 'function',
  INTERFACE = 'interface',
  NUMBER = 'number',
  STRING = 'string',
  THIS = 'this',
  TYPE = 'type',
}

export interface SwaxiosConstructor extends SwaxiosFunction {
  header: SwaxiosConstructorHeader;
  name: 'constructor';
  returnType: TypeScriptType.THIS;
}

export interface SwaxiosGetter extends SwaxiosFunction {
  getter: true;
}

export interface SwaxiosSetter extends SwaxiosFunction {
  setter: true;
}

export interface SwaxiosArgument {
  name: string;
  optional?: boolean;
  type: TypeScriptType | string | (TypeScriptType | string)[];
}

export interface SwaxiosConstructorHeader extends SwaxiosFunctionHeader {
  isAsync: false;
  isConstructor: true;
}

export interface SwaxiosFunctionHeader {
  arguments?: SwaxiosArgument[];
  description?: string;
  isAsync?: boolean;
  isPrivate?: boolean;
  isStatic?: boolean;
  overloads?: Omit<SwaxiosFunctionHeader, 'returnType'>[];
  returnType?: TypeScriptType | string;
}

export interface SwaxiosFunction {
  header?: SwaxiosFunctionHeader;
  content?: SwaxiosFunctionContent;
  name: string;
}

export interface SwaxiosClassValue extends SwaxiosInterfaceValue {
  isPrivate?: boolean;
  isReadonly?: boolean;
  isStatic?: boolean;
}

export interface SwaxiosInterfaceValue {
  description?: string;
  name: string;
  isOptional?: boolean;
  type: TypeScriptType | string;
}

export interface SwaxiosClass {
  description?: string;
  constructor: SwaxiosConstructor;
  functions?: (SwaxiosFunction | SwaxiosGetter | SwaxiosSetter)[];
  name: string;
  values?: SwaxiosClassValue[];
}

export interface SwaxiosInterface {
  description?: string;
  name: string;
  values: SwaxiosInterfaceValue[];
}

export interface SwaxiosType {
  description?: string;
  name: string;
  type: TypeScriptType | string;
}

export type SwaxiosFunctionContent = string;

export interface Swaxios {
  classes?: SwaxiosClass[];
  interfaces?: SwaxiosInterface[];
  mainClass: SwaxiosClass;
}
