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

import {
  InterfaceDeclarationStructure,
  OptionalKind,
  Project,
  PropertySignatureStructure,
  SourceFile,
  TypeAliasDeclarationStructure,
} from 'ts-morph';

import {Schema, Spec} from 'swagger-schema-official';
import {inspect} from 'util';
import {StringUtil} from '../util';
import * as SortUtil from '../util/SortUtil';
import {header} from './header';
import {SwaggerType} from './SwaggerType';
import {TypeScriptType} from './TypeScriptType';

export class InterfacesBuilder {
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

  private buildLowLevelTypes(multipleSchemas: Schema[], schemaName: string, joinToken: string): string {
    const schemaNames: string[] = [];

    return multipleSchemas
      .map(schema => {
        const uniqueName = StringUtil.uniqueName(schemaName, schemaNames);
        schemaNames.push(uniqueName);
        return this.buildLowLevelType(schema, uniqueName);
      })
      .join(` ${joinToken} `);
  }

  private buildLowLevelType(schema: Schema, schemaName: string): string {
    const {$ref, allOf: multipleSchemas, enum: enumType, required: requiredProperties, properties} = schema;
    let schemaType = schema.type;

    if ($ref) {
      if (!$ref.startsWith('#/definitions')) {
        console.warn(`Invalid reference "${$ref}".`);
        return TypeScriptType.EMPTY_OBJECT;
      }
      if (!this.spec.definitions) {
        console.warn(`No reference found for "${$ref}".`);
        return TypeScriptType.EMPTY_OBJECT;
      }
      return $ref.replace('#/definitions/', '');
    }

    if (multipleSchemas) {
      return this.buildLowLevelTypes(multipleSchemas, schemaName, '&');
    }

    if (enumType) {
      return `"${enumType.join('" | "')}"`;
    }

    schemaType = schemaType || SwaggerType.OBJECT;

    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        return TypeScriptType.STRING;
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        return TypeScriptType.NUMBER;
      }
      case SwaggerType.OBJECT: {
        if (!properties) {
          console.warn(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return TypeScriptType.EMPTY_OBJECT;
        }

        const schema: Record<string, string> = {};

        for (const [propertyName, property] of Object.entries(properties)) {
          const fullName =
            requiredProperties && !requiredProperties.includes(propertyName) ? `${propertyName}?` : propertyName;
          schema[fullName] = this.buildLowLevelType(property, `${schemaName}/${propertyName}`);
        }

        return inspect(schema, {breakLength: Infinity, depth: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
      }
      case SwaggerType.ARRAY: {
        if (!schema.items) {
          console.warn(`Schema type for "${schemaName}" is "array" but has no items.`);
          return `${TypeScriptType.ARRAY}<${TypeScriptType.ANY}>`;
        }

        if (!(schema.items instanceof Array)) {
          const itemType = this.buildLowLevelType(schema.items, schemaName);
          return `${TypeScriptType.ARRAY}<${itemType}>`;
        }

        const schemas = this.buildLowLevelTypes(schema.items, schemaName, '|');

        return `${TypeScriptType.ARRAY}<${schemas}>`;
      }
      default: {
        return TypeScriptType.EMPTY_OBJECT;
      }
    }
  }

  private buildInterfaceDeclaration(schema: Schema, schemaName: string): OptionalKind<InterfaceDeclarationStructure> {
    const required = schema.required || [];

    const properties = Object.entries(schema.properties!)
      .sort(SortUtil.sortEntries)
      .map(([propertyName, property]) => {
        const type = this.buildLowLevelType(property, propertyName);
        const structure: OptionalKind<PropertySignatureStructure> = {
          docs: property.description ? [property.description] : undefined,
          hasQuestionToken: !(required.includes(propertyName) || property.required),
          isReadonly: !!property.readOnly,
          name: propertyName,
          type,
        };
        return structure;
      });

    return {
      isExported: true,
      name: schemaName,
      properties,
    };
  }

  private buildTypeDeclaration(schema: Schema, schemaName: string): OptionalKind<TypeAliasDeclarationStructure> {
    return {
      docs: schema.description ? [schema.description] : undefined,
      isExported: true,
      name: schemaName,
      type: this.buildLowLevelType(schema, schemaName),
    };
  }

  private buildTypeDeclarations(schemas: Schema[], schemaName: string): OptionalKind<TypeAliasDeclarationStructure> {
    return {
      isExported: true,
      name: schemaName,
      type: this.buildLowLevelTypes(schemas, schemaName, '&'),
    };
  }

  private buildInterface(schema: Schema, schemaName: string, sourceFile: SourceFile): void {
    if (schema.properties) {
      sourceFile!.addInterface(this.buildInterfaceDeclaration(schema, schemaName));
      return;
    }

    if (schema.enum) {
      sourceFile!.addTypeAlias(this.buildTypeDeclaration(schema, schemaName));
      return;
    }

    if (schema.allOf) {
      sourceFile!.addTypeAlias(this.buildTypeDeclarations(schema.allOf, schemaName));
    }
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

    Object.entries(definitions).forEach(([schemaName, schema]) => {
      if (this.separateFiles) {
        sourceFile = this.project.createSourceFile(`${this.outputDir}/interfaces/${schemaName}.ts`);
      }

      this.buildInterface(schema, schemaName, sourceFile);

      if (this.separateFiles) {
        sourceFile.insertStatements(0, header);
      }
    });

    if (!this.separateFiles) {
      sourceFile!.insertStatements(0, header);
    }

    return [sourceFile!];
  }
}
