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
import {
  ClassDeclarationStructure,
  ConstructorDeclarationStructure,
  OptionalKind,
  Project,
  Scope,
  SourceFile,
} from 'ts-morph';

import {StringUtil} from '../util';
import {header} from './header';

export interface API {
  name: string;
}

export interface APIStructure {
  api: Record<string, APIStructure | API>;
}

export class ServicesBuilder {
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

  private generatePaths(paths: Record<string, Path>): {fullPath: string[]; name: string}[] {
    const serviceNames: string[] = [];

    return Object.keys(paths)
      .sort()
      .map(pathName => {
        const normalizedUrl = StringUtil.normalizeUrl(pathName);
        const serviceName = StringUtil.generateServiceName(normalizedUrl);
        const uniqueName = StringUtil.uniqueName(serviceName, serviceNames);
        serviceNames.push(uniqueName);

        let directories = normalizedUrl
          .substr(0, normalizedUrl.lastIndexOf('/'))
          .split('/')
          .filter(Boolean);

        if (!directories.length) {
          directories = ['Root'];
        }

        return {fullPath: directories, name: uniqueName};
      });
  }

  build(): SourceFile[] {
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
          namespaceImport: 'Interfaces',
        },
      ]);
    }

    function addHeader(source: SourceFile): void {
      source.insertStatements(0, header);
    }

    if (!this.separateFiles) {
      sourceFile = this.project.createSourceFile(`${this.outputDir}/services.ts`);
      addDefaultImports(sourceFile);
    }

    const paths = this.generatePaths(this.spec.paths);

    for (const pathObj of paths) {
      if (this.separateFiles) {
        sourceFile = this.project.createSourceFile(`${this.outputDir}/services/${pathObj.fullPath}/${pathObj.name}.ts`);
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

      const classDeclaration: OptionalKind<ClassDeclarationStructure> = {
        ctors: [ctor],
        isExported: true,
        name: pathObj.name,
        properties: [
          {
            isReadonly: true,
            name: 'apiClient',
            scope: Scope.Private,
            type: 'AxiosInstance',
          },
        ],
      };

      if (this.separateFiles) {
        addHeader(sourceFile!);
        sourceFile!.addClass(classDeclaration);
      } else {
        let namespace = sourceFile!.addNamespace({
          isExported: true,
          name: pathObj.fullPath.pop()!,
        });

        while (pathObj.fullPath.length) {
          namespace = namespace.addNamespace({
            isExported: true,
            name: pathObj.fullPath.pop()!,
          });
        }

        namespace!.addClass(classDeclaration);
      }
    }

    if (!this.separateFiles) {
      addHeader(sourceFile!);
    }

    return [sourceFile!];
  }
}
