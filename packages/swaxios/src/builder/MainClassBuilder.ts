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

import * as path from 'path';
import {Spec} from 'swagger-schema-official';
import {
  ClassDeclarationStructure,
  ConstructorDeclarationStructure,
  OptionalKind,
  Project,
  Scope,
  SourceFile,
} from 'ts-morph';
import {inspect} from 'util';

import {StringUtil} from '../util';
import {header} from './header';
import {TypeScriptType} from './TypeScriptType';

export interface CircularRecord {
  [name: string]: CircularRecord | string;
}

export interface APIStructure {
  [name: string]: CircularRecord;
}

export class MainClassBuilder {
  private readonly outputDir: string;
  private readonly project: Project;
  private readonly separateFiles?: boolean;
  private readonly spec: Spec;

  constructor(spec: Spec, project: Project, outputDir: string, separateFiles?: boolean) {
    this.outputDir = outputDir;
    this.project = project;
    this.separateFiles = separateFiles;
    this.spec = spec;
  }

  build(): SourceFile {
    const {info} = this.spec;
    const sourceFile = this.project.createSourceFile(`${this.outputDir}/APIClient.ts`);
    const apiInfo = this.buildAPIInfo();

    sourceFile.addImportDeclaration({
      defaultImport: 'axios',
      moduleSpecifier: 'axios',
      namedImports: [
        {
          name: 'AxiosInstance',
        },
        {
          name: 'AxiosRequestConfig',
        },
      ],
    });

    if (this.separateFiles) {
      for (const importInfo of apiInfo.imports) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: importInfo.path,
          namedImports: [
            {
              name: importInfo.name,
            },
          ],
        });
      }
    } else {
      sourceFile.addImportDeclaration({
        moduleSpecifier: './services',
        namespaceImport: 'Services',
      });
    }

    const ctor: OptionalKind<ConstructorDeclarationStructure> = {
      overloads: [
        {
          parameters: [
            {
              name: 'baseURL',
              type: TypeScriptType.STRING,
            },
          ],
        },
        {
          parameters: [
            {
              name: 'config',
              type: 'AxiosRequestConfig',
            },
          ],
        },
      ],
      parameters: [
        {
          name: 'configOrBaseURL',
          type: `AxiosRequestConfig | ${TypeScriptType.STRING}`,
        },
      ],
      statements: [
        'if (typeof configOrBaseURL === "string") {',
        '  configOrBaseURL = {baseURL: configOrBaseURL};',
        '}',
        'this.httpClient = axios.create(configOrBaseURL);',
      ],
    };

    // const simpleLet: StatementStructures = {
    //   kind: StructureKind.VariableStatement,
    //   declarations: [
    //     {
    //       name: 'api',
    //       initializer: '{}',
    //     }
    //   ],
    // }

    const mainClass: OptionalKind<ClassDeclarationStructure> = {
      ctors: [ctor],
      docs: [info.description || ''],
      getAccessors: [
        {
          name: 'defaults',
          statements: 'return this.httpClient.defaults',
        },
        {
          name: 'interceptors',
          statements: 'return this.httpClient.interceptors;',
        },
        {
          name: 'rest',
          statements: apiInfo.api,
        },
      ],
      isExported: true,
      name: 'APIClient',
      properties: [
        {
          isReadonly: true,
          name: 'httpClient',
          scope: Scope.Private,
          type: 'AxiosInstance',
        },
      ],
    };

    sourceFile.addClass(mainClass);

    // this needs to be at the end or ts-morph will throw an error.
    sourceFile.insertStatements(0, header);

    return sourceFile;
  }

  private mergeDeep(source: Record<string, any>, target?: Record<string, any>): Record<string, any> {
    const destination: Record<string, any> = {};

    if (target instanceof Object) {
      for (const key in target) {
        destination[key] = target[key];
      }
    }

    for (const key in source) {
      if (!(source[key] instanceof Object) || !target || target[key]) {
        destination[key] =
          !(source[key] instanceof Object) || !target || target[key]
            ? source[key]
            : this.mergeDeep(source[key], target[key]);
      }
    }

    return destination;
  }

  private buildObjFromPath(obj: APIStructure, importPath: string[]): CircularRecord {
    const lastName = importPath.shift()!;
    if (importPath.length === 1) {
      return {[lastName]: importPath.shift()!};
    }
    return {[lastName]: this.buildObjFromPath(obj, importPath)};
  }

  private buildAPIInfo(): {api: string[]; imports: {name: string; path: string}[]} {
    let apiStructure: APIStructure = {};
    const imports: {name: string; path: string}[] = [];

    if (this.separateFiles) {
      const sourceFiles = this.project.getSourceFiles(`${this.outputDir}/services/**/*.ts`);

      for (const sourceFile of sourceFiles.filter(Boolean) as SourceFile[]) {
        const sourceClasses = sourceFile.getClasses();
        for (const sourceClass of sourceClasses) {
          const className = sourceClass.getName();
          if (className) {
            const relativeImportPath = path.relative(this.outputDir, sourceFile.getFilePath().replace('.ts', ''));
            const obj = this.buildObjFromPath({}, relativeImportPath.replace('services/', '').split('/'));
            apiStructure = this.mergeDeep(obj, apiStructure);
            imports.push({name: className, path: `./${relativeImportPath}`});
          }
        }
      }
    } else {
      const sourceFile = this.project.getSourceFile(`${this.outputDir}/services.ts`);
      if (sourceFile) {
        const namespaces = sourceFile.getNamespaces();
        for (const namesp of namespaces) {
          const sourceClasses = namesp.getClasses();
          const namespaceName = namesp.getName();
          for (const sourceClass of sourceClasses) {
            const className = sourceClass.getName();
            if (className) {
              const apiName = StringUtil.lowercaseFirstLetter(namespaceName);
              apiStructure[apiName] = {
                ...apiStructure[apiName],
                [StringUtil.lowercaseFirstLetter(className)]: `Services.${namespaceName}.${className}`,
              };
              const relativeImportPath = path.relative(this.outputDir, sourceFile.getFilePath().replace('.ts', ''));
              imports.push({name: className, path: `./${relativeImportPath}`});
            }
          }
        }
      }
    }

    const classesStructure = inspect(apiStructure, {depth: Infinity}).replace(/'/g, '');

    const api = [`return ${classesStructure}`];

    return {api, imports};
  }
}
