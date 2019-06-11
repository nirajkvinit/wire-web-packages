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
import {ClassesGenerator, InterfacesGenerator, MainGenerator} from './generators';
import {FileUtil, OpenAPIUtil} from './util';

export enum TypeScriptType {
  ANY = 'any',
  ARRAY = 'Array',
  BOOLEAN = 'boolean',
  EMPTY_OBJECT = '{}',
  NUMBER = 'number',
  STRING = 'string',
}

export interface ClientValue {
  immutable?: boolean;
  name: string;
  readonly?: boolean;
  type: TypeScriptType;
}

export interface Client {
  classes: ClassesGenerator;
  interfaces: InterfacesGenerator;
  main: MainGenerator;
}

export interface GeneratedClient {
  /** A record of path and content */
  classes: Record<string, string>;
  /** A record of path and content */
  indexFiles: Record<string, string>;
  /** A record of path and content */
  interfaces: Record<string, string>;
  main: string;
}

/**
 * @param inputFile File path (or URL) to OpenAPI Specification, i.e. `swagger.json`
 * @param outputDirectory Path to output directory for generated TypeScript code
 * @param forceDeletion Force deleting the output directory before generating
 */
export async function readSpec(inputFile: string): Promise<Spec> {
  const isUrl = /^(https?|file|ftp):\/\/.+/.test(inputFile);
  const specification = isUrl ? await FileUtil.readInputURL(inputFile) : await FileUtil.readInputFile(inputFile);
  await OpenAPIUtil.validateConfig(specification);
  return specification;
}

async function buildClient(specification: Spec): Promise<Client> {
  const interfaces = new InterfacesGenerator(specification);
  const classes = new ClassesGenerator(specification, interfaces);
  const main = new MainGenerator(specification, interfaces, classes);

  return {
    classes,
    interfaces,
    main,
  };
}

export async function generateClient(specification: Spec): Promise<GeneratedClient> {
  const client = await buildClient(specification);
  /** A map of paths and files to export */
  const indices: Record<string, string[]> = {};

  const classes = client.classes.reduce((result: Record<string, string>, clientClass) => {
    indices[clientClass.dirName] = [...indices[clientClass.dirName], clientClass.fileName];
    result[clientClass.name] = clientClass.toString();
    return result;
  }, {});

  const interfaces = client.interfaces.reduce((result: Record<string, string>, clientInterface) => {
    indices[clientInterface.dirName] = [...indices[clientInterface.dirName], clientInterface.fileName];
    result[clientInterface.name] = clientInterface.toString();
    return result;
  }, {});

  const indexFiles = Object.keys(indices).reduce((result: Record<string, string>, indexPath) => {
    result[indexPath] = indices[indexPath].toString();
    return result;
  }, {});

  return {
    classes,
    indexFiles,
    interfaces,
    main: client.main.toString(),
  };
}

export {writeClient} from './util/FileUtil';
