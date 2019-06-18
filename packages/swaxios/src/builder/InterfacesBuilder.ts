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

import {OptionalKind, Project, PropertySignatureStructure, SourceFile} from 'ts-morph';

import {Spec} from 'swagger-schema-official';
import * as SortUtil from '../util/SortUtil';
import {SwaggerType} from './SwaggerType';
import {TypeScriptType} from './TypeScriptType';

function generateSimpleType(type: string): TypeScriptType {
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

export class InterfaceBuilder {
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

  buildInterfaces(): SourceFile[] {
    const {definitions} = this.spec;
    let sourceFile: SourceFile;

    if (!definitions) {
      return [];
    }

    if (!this.separateFiles) {
      sourceFile = this.project.createSourceFile(`${this.outputDir}/interfaces.ts`);
    }

    for (const [definitionName, definition] of Object.entries(definitions)) {
      if (this.separateFiles) {
        sourceFile = this.project.createSourceFile(`${this.outputDir}/interfaces/${definitionName}.ts`);
      }

      const required = definition.required || [];
      const hasEnum = definition.enum;

      if (hasEnum) {
        sourceFile!.addTypeAlias({
          docs: definition.description ? [definition.description] : undefined,
          isExported: true,
          name: definitionName,
          type: `"${hasEnum.join('" | "')}"`,
        });
        continue;
      }

      const properties: OptionalKind<PropertySignatureStructure>[] = Object.entries(definition.properties || {})
        .sort(SortUtil.sortEntries)
        .map(([propertyName, property]) => {
          return {
            docs: property.description ? [property.description] : undefined,
            hasQuestionToken: !(required.includes(propertyName) || property.required),
            isReadonly: !!property.readOnly,
            name: propertyName,
            type: generateSimpleType(property.type || ''),
          };
        });

      sourceFile!.addInterface({
        isExported: true,
        name: definitionName,
        properties,
      });
    }

    return [sourceFile!];
  }
}
