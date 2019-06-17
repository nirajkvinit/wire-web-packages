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

import prettier from 'prettier';
import {Spec} from 'swagger-schema-official';
import {inspect} from 'util';

import {ClientValue, TypeScriptType} from './ClientValue';
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

export class Swaxios {
  public writeClient = FileUtil.writeClient;

  constructor() {}

  /**
   * @param inputFile File path (or URL) to OpenAPI Specification, i.e. `swagger.json`
   */
  async readSpec(inputFile: string): Promise<Spec> {
    const isUrl = /^(https?|file|ftp):\/\/.+/.test(inputFile);
    const specification = isUrl ? await FileUtil.readInputURL(inputFile) : await FileUtil.readInputFile(inputFile);
    await OpenAPIUtil.validateConfig(specification);
    return specification;
  }

  async generateClient(specification: Spec): Promise<Client> {
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

  private convert(obj: any, type: TypeScriptType): string {
    const inspectOptions = {
      breakLength: Infinity,
      depth: Infinity,
    };

    switch (type) {
      case TypeScriptType.ARRAY: {
        return inspect(obj).replace(/[\[\]]/g, '');
      }
      case TypeScriptType.INTERFACE: {
        return Object.entries(obj as Record<string, ClientValue>).reduce((result, [key, val]) => {
          return `${result}  ${key}${val.required ? '' : '?'}: ${val.type};\n`;
        }, '');
      }
      case TypeScriptType.STRING: {
        return inspect(obj, inspectOptions);
      }
      case TypeScriptType.TYPE: {
        return inspect(obj, inspectOptions).replace(/["']/g, '');
      }
      default: {
        return inspect(obj, inspectOptions);
      }
    }
  }

  private format(code: string): string {
    return prettier.format(code, {
      bracketSpacing: false,
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'es5',
    });
  }

  async generateFiles(specification: Spec, singleFiles?: boolean): Promise<GeneratedClient> {
    const {classes, indices, interfaces, main} = await this.generateClient(specification);

    const generatedClasses = classes.getValues().reduce((result: Record<string, string>, clientClass) => {
      result[clientClass.name] = this.format(clientClass.toString());
      return result;
    }, {});

    const generatedInterfaces = interfaces.getValues().reduce((result: Record<string, string>, clientInterface) => {
      const equalSign = clientInterface.type === 'interface' ? ' {\n  ' : ' =';
      const postFix = clientInterface.type === 'interface' ? '\n}' : ';';
      const values = this.convert(clientInterface.values, clientInterface.type);

      let connections = '';

      if (!singleFiles && 'connections' in clientInterface) {
        connections = clientInterface.connections
          .map(connection => `import {${connection}} from './${connection}';`)
          .join('\n');
        connections += '\n\n';
      }

      const content = `${connections}export ${clientInterface.type} ${clientInterface.name}${equalSign}${values}${postFix}`;
      result[`interfaces/${clientInterface.name}`] = this.format(content);
      return result;
    }, {});

    const generatedIndices = Object.entries(indices.indexFiles).reduce(
      (result: Record<string, string>, [indexPath, index]) => {
        const content = index.map(indexFile => `export * from '${indexFile}';`).join('\n');
        result[indexPath] = this.format(content);
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
}
