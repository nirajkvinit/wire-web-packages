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
  ConstructorDeclarationStructure,
  IndentationText,
  OptionalKind,
  Project,
  PropertySignatureStructure,
  QuoteKind,
  SourceFile,
} from 'ts-morph';

import * as StringUtil from '../util/StringUtil';

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
  INTERFACE = 'interface',
  NUMBER = 'number',
  STRING = 'string',
  TYPE = 'type',
}

export function generateSimpleType(type: string): TypeScriptType {
  if (!type) {
    return TypeScriptType.ANY;
  }

  switch (type.toLowerCase()) {
    case SwaggerType.INTEGER:
    case SwaggerType.NUMBER: {
      return TypeScriptType.NUMBER;
    }
    case SwaggerType.STRING: {
      return TypeScriptType.STRING;
    }
    case SwaggerType.BOOLEAN: {
      return TypeScriptType.BOOLEAN;
    }
    default: {
      return TypeScriptType.ANY;
    }
  }
}

export class Builder {
  public classes?: SourceFile;
  public interfaces?: SourceFile;
  public mainClass: SourceFile;
  private readonly spec: Spec;
  private readonly project: Project;
  private readonly outputDir: string;

  constructor(spec: Spec, outputDir: string) {
    this.spec = spec;
    this.outputDir = outputDir;

    this.project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
    });
    this.interfaces = this.buildInterfaces();
    this.classes = this.buildClasses();
    this.mainClass = this.buildMainClass();
  }

  private buildInterfaces(): SourceFile {
    const {definitions} = this.spec;
    const interfaces = this.project.createSourceFile(`${this.outputDir}/interfaces.ts`);

    if (!definitions) {
      return interfaces;
    }

    for (const [definitionName, definition] of Object.entries(definitions)) {
      const required = definition.required || [];
      const hasEnum = definition.enum;

      if (hasEnum) {
        interfaces.addTypeAlias({
          docs: definition.description ? [definition.description] : undefined,
          isExported: true,
          name: definitionName,
          type: `"${hasEnum.join('" | "')}"`,
        });
        continue;
      }

      const properties: OptionalKind<PropertySignatureStructure>[] = Object.entries(definition.properties || {}).map(
        ([propertyName, property]) => {
          return {
            docs: property.description ? [property.description] : undefined,
            hasQuestionToken: !(required.includes(propertyName) || property.required),
            isReadonly: !!property.readOnly,
            name: propertyName,
            type: 'number',
          };
        }
      );

      interfaces.addInterface({
        isExported: true,
        name: definitionName,
        properties,
      });
    }

    return interfaces;
  }

  private buildClasses(): SourceFile {
    const sourceFile = this.project.createSourceFile(`${this.outputDir}/classes.ts`);

    sourceFile.addImportDeclarations([
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

    const serviceNames = [];

    for (const [pathName] of Object.entries(this.spec.paths)) {
      const normalizedUrl = StringUtil.normalizeUrl(pathName);
      const serviceName = StringUtil.generateServiceName(normalizedUrl);
      const uniqueName = StringUtil.uniqueServiceName(serviceName, serviceNames);
      serviceNames.push(uniqueName);

      const ctor: OptionalKind<ConstructorDeclarationStructure> = {
        parameters: [
          {
            name: 'apiClient',
            type: 'AxiosInstance',
          },
        ],
        statements: ['this.apiClient = apiClient;'],
      };

      sourceFile.addClass({
        ctors: [ctor],
        isExported: true,
        name: uniqueName,
        properties: [
          {
            isReadonly: true,
            leadingTrivia: 'private ',
            name: 'apiClient',
            type: 'AxiosInstance',
          },
        ],
      });
    }

    return sourceFile;
  }

  private buildMainClass(): SourceFile {
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

    sourceFile.addClass({
      ctors: [ctor],
      docs: [`API Client for ${info.title}\n${info.description || ''}`],
      isExported: true,
      methods: [
        {
          leadingTrivia: 'get ',
          name: 'rest',
          statements: ['return ""'],
        },
      ],
      name: 'APIClient',
      properties: [
        {
          isReadonly: true,
          leadingTrivia: 'private ',
          name: 'httpClient',
          type: 'AxiosInstance',
        },
      ],
    });

    return sourceFile;
  }

  public save(): Promise<void> {
    return this.project.save();
  }
}
