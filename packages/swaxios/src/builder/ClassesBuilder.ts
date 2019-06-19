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

import {Path, Spec} from 'swagger-schema-official';
import {ConstructorDeclarationStructure, OptionalKind, Project, SourceFile} from 'ts-morph';

import {SortUtil, StringUtil} from '../util';
import {header} from './header';

export class ClassesBuilder {
  private readonly spec: Spec;
  private readonly project: Project;
  private readonly outputDir: string;
  private readonly separateFiles?: boolean;

  constructor(spec: Spec, project: Project, outputDir: string, separateFiles?: boolean) {
    this.spec = spec;
    this.project = project;
    this.outputDir = outputDir;
    this.separateFiles = separateFiles;
  }

  buildClasses(): SourceFile[] {
    let sourceFile: SourceFile;

    function addDefaultImports(source: SourceFile): void {
      source.addImportDeclarations([
        {
          moduleSpecifier: 'axios',
          namedImports: [
            {
              name: 'AxiosInstance',
            },
          ],
        },
        {
          moduleSpecifier: './interfaces',
          namespaceImport: 'interfaces',
        },
      ]);
    }

    if (!this.separateFiles) {
      sourceFile = this.project.createSourceFile(`${this.outputDir}/services.ts`);
      addDefaultImports(sourceFile);
    }

    const serviceNames: string[] = [];

    const paths: [string, Path][] = Object.entries(this.spec.paths)
      .sort(SortUtil.sortEntries)
      .map(([pathName, path]) => {
        const normalizedUrl = StringUtil.normalizeUrl(pathName);
        const serviceName = StringUtil.generateServiceName(normalizedUrl);
        const uniqueName = StringUtil.uniqueServiceName(serviceName, serviceNames);
        serviceNames.push(uniqueName);
        return [uniqueName, path];
      });

    for (const [pathName] of paths) {
      if (this.separateFiles) {
        sourceFile = this.project.createSourceFile(`${this.outputDir}/services/${pathName}.ts`);
        addDefaultImports(sourceFile);
      }

      const ctor: OptionalKind<ConstructorDeclarationStructure> = {
        parameters: [
          {
            name: 'apiClient',
            type: 'AxiosInstance',
          },
        ],
        statements: ['this.apiClient = apiClient;'],
      };

      sourceFile!.addClass({
        ctors: [ctor],
        isExported: true,
        name: pathName,
        properties: [
          {
            isReadonly: true,
            leadingTrivia: 'private ',
            name: 'apiClient',
            type: 'AxiosInstance',
          },
        ],
      });

      if (this.separateFiles) {
        sourceFile!.insertStatements(0, header);
      }
    }

    if (!this.separateFiles) {
      sourceFile!.insertStatements(0, header);
    }

    return [sourceFile!];
  }
}
