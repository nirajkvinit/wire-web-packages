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
import {
  ClassDeclarationStructure,
  ConstructorDeclarationStructure,
  OptionalKind,
  Project,
  Scope,
  SourceFile,
} from 'ts-morph';

import {header} from './header';
import {TypeScriptType} from './TypeScriptType';

export class MainClassBuilder {
  private readonly outputDir: string;
  private readonly project: Project;
  private readonly separateFiles?: boolean;
  private readonly spec: Spec;

  constructor(spec: Spec, project: Project, outputDir: string, separateFiles?: boolean) {
    this.outputDir = outputDir;
    this.project = project;
    this.spec = spec;
  }

  buildMainClass(): SourceFile {
    const {info} = this.spec;
    const sourceFile = this.project.createSourceFile(`${this.outputDir}/APIClient.ts`);

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

    const mainClass: OptionalKind<ClassDeclarationStructure> = {
      ctors: [ctor],
      docs: [info.description || ''],
      getAccessors: [
        {
          name: 'defaults',
          statements: ['return this.httpClient.defaults;'],
        },
        {
          name: 'interceptors',
          statements: ['return this.httpClient.interceptors;'],
        },
        {
          name: 'rest',
          statements: ['return ""'],
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

  buildAPI(): void {
    const sourceFiles = this.separateFiles
      ? this.project.getSourceFiles(`${this.outputDir}/services/*.ts`)
      : [this.project.getSourceFile(`${this.outputDir}/services.ts`)];

    for (const sourceFile of sourceFiles) {
      console.log('sourceFile', sourceFile);
    }
  }
}
