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

import logdown from 'logdown';
import {Schema, Spec} from 'swagger-schema-official';

import {ClientValue, TypeScriptType} from '../ClientValue';

export enum SwaggerType {
  ARRAY = 'array',
  INTEGER = 'integer',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}

export enum HttpMethod {
  DELETE = 'delete',
  GET = 'get',
  HEAD = 'head',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
  REQUEST = 'request',
}

export interface ClientInterface {
  name: string;
  type: 'interface';
  values: Record<string, ClientValue>;
}

export interface ClientType {
  name: string;
  type: 'type';
  values: string;
}

export interface ClientEnum {
  name: string;
  type: 'enum';
  values: (string | number | boolean | {})[];
}

export type ClientTypeValue = ClientInterface | ClientType | ClientEnum;

export class InterfacesGenerator {
  private readonly specification: Spec;
  private readonly logger: logdown.Logger;

  /** [name, data] */
  readonly interfaces: Map<string, ClientTypeValue>;

  constructor(specification: Spec) {
    this.specification = specification;
    this.logger = logdown('swaxios/InterfacesGenerator', {
      logger: console.log,
      markdown: false,
    });
    this.interfaces = new Map();
    this.buildInterfaces();
  }

  getSchemaFromRef(ref: string): Schema | undefined {
    if (!ref.startsWith('#/definitions')) {
      console.warn(`Invalid reference "${ref}".`);
      return;
    }
    const definitionString = ref.replace('#/definitions', '');
    const definition = (this.specification.definitions || {})[definitionString];

    if (!definition) {
      console.warn(`No reference found for "${ref}".`);
      return;
    }

    return definition.$ref ? this.getSchemaFromRef(definition.$ref) : definition;
  }

  private buildInterfaces(): void {
    if (!this.specification.definitions) {
      this.logger.warn('OpenAPI specification has no definitions');
    } else {
      for (const [name, definition] of Object.entries(this.specification.definitions)) {
        this.addInterface(definition, name);
      }
    }
  }

  private buildInterface(schema: Schema, schemaName: string): ClientTypeValue {
    let {required: requiredProperties, properties, type: schemaType} = schema;
    const {allOf: multipleSchemas, enum: enumType} = schema;

    if (multipleSchemas) {
      const names = multipleSchemas
        .map(includedSchema => {
          this.addInterface(includedSchema, schemaName);
          return schemaName;
        })
        .join('|');
      return {type: 'type', name: schemaName, values: names};
    }

    if (enumType) {
      return {type: 'enum', name: schemaName, values: enumType};
    }

    if (schema.$ref) {
      if (!schema.$ref.startsWith('#/definitions')) {
        console.warn(`Invalid reference "${schema.$ref}".`);
        return {name: schemaName, type: 'interface', values: {}};
      }

      if (!this.specification.definitions) {
        console.warn(`No reference found for "${schema.$ref}".`);
        return {name: schemaName, type: 'interface', values: {}};
      }

      const definition = schema.$ref.replace('#/definitions', '');
      requiredProperties = this.specification.definitions[definition].required;
      properties = this.specification.definitions[definition].properties;
      schemaType = this.specification.definitions[definition].type;
    }

    schemaType = schemaType || SwaggerType.OBJECT;

    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        return {name: schemaName, type: 'type', values: TypeScriptType.STRING};
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        return {name: schemaName, type: 'type', values: TypeScriptType.NUMBER};
      }
      case SwaggerType.OBJECT: {
        if (!properties) {
          this.logger.warn(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return {name, type: 'interface', values: {}};
        }

        const values = Object.entries(properties).reduce((result: Record<string, ClientValue>, [name, property]) => {
          this.addInterface(property, name);

          result[name] = {
            name,
            required: requiredProperties && requiredProperties.includes(name),
            type: name,
          };
          return result;
        }, {});

        return {type: 'interface', name: schemaName, values};
      }
      case SwaggerType.ARRAY: {
        if (!schema.items) {
          this.logger.warn(`Schema type for "${schemaName}" is "array" but has no items.`);
          return {name, type: 'type', values: `${TypeScriptType.ARRAY}<${TypeScriptType.ANY}>`};
        }

        if (!(schema.items instanceof Array)) {
          const itemType = this.addInterface(schema.items, schemaName);
          return {name: schemaName, type: 'type', values: `${TypeScriptType.ARRAY}<${itemType}>`};
        }

        const schemas = schema.items
          .map((itemSchema, index) => {
            this.addInterface(itemSchema, `${schemaName}[${index}]`);
            return schemaName;
          })
          .join('|');
        return {name: schemaName, type: 'type', values: `${TypeScriptType.ARRAY}<${schemas}>`};
      }
      default: {
        return {name: schemaName, type: 'interface', values: {}};
      }
    }
  }

  addInterface(schema: Schema, name: string): boolean {
    if (!this.interfaces.get(name)) {
      const clientInterface = this.buildInterface(schema, name);
      this.interfaces.set(name, clientInterface);
      return true;
    }

    return false;
  }

  getValues(): ClientTypeValue[] {
    return Array.from(this.interfaces.values());
  }

  getKeys(): string[] {
    return Array.from(this.interfaces.keys());
  }

  getByName(name: string): ClientTypeValue | void {
    return this.interfaces.get(name);
  }
}
