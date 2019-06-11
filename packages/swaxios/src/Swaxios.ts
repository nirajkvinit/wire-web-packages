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
import {inspect} from 'util';
import {ClassesGenerator, IndexGenerator, InterfacesGenerator, MainGenerator} from './generators';
import {FileUtil, OpenAPIUtil} from './util';

export interface Client {
  classes: ClassesGenerator;
  interfaces: InterfacesGenerator;
  indices: IndexGenerator;
  main: MainGenerator;
}

export interface GeneratedClient {
  /** A record of path and content */
  classes: Record<string, string>;
  /** A record of path and content */
  indices: Record<string, string>;
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

export async function generateClient(specification: Spec): Promise<Client> {
  const interfaces = new InterfacesGenerator(specification);
  const classes = new ClassesGenerator(specification, interfaces);
  const main = new MainGenerator(specification, interfaces, classes);
  const indices = new IndexGenerator(interfaces, classes, main);

  return {
    classes,
    indices,
    interfaces,
    main,
  };
}

export async function generateFiles(specification: Spec): Promise<GeneratedClient> {
  const {classes, indices, interfaces, main} = await generateClient(specification);

  const generatedClasses = classes.getValues().reduce((result: Record<string, string>, clientClass) => {
    result[clientClass.name] = clientClass.toString();
    return result;
  }, {});

  const generatedInterfaces = interfaces.getValues().reduce((result: Record<string, string>, clientInterface) => {
    const equalSign = clientInterface.type === 'interface' ? '' : ' =';
    result[clientInterface.name] = `export ${clientInterface.type} ${clientInterface.name}${equalSign} ${inspect(
      clientInterface.values
    )}`;
    return result;
  }, {});

  const generatedIndices = Object.entries(indices.indexFiles).reduce(
    (result: Record<string, string>, [indexPath, index]) => {
      result[indexPath] = index.map(indexFile => `export * from '${indexFile}';`).join('\n');
      return result;
    },
    {}
  );

  return {
    classes: generatedClasses,
    indices: generatedIndices,
    interfaces: generatedInterfaces,
    main: main.toString(),
  };
}

export {writeClient} from './util/FileUtil';
