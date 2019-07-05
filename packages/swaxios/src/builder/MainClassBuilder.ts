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
import {SwaxiosClass, SwaxiosConstructor, TypeScriptType} from '../definitions';

export class MainClassGenerator {
  private readonly spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
  }

  private buildConstructor(): SwaxiosConstructor {
    return {
      header: {
        arguments: [
          {
            name: 'configOrBaseUrl',
            type: [TypeScriptType.STRING, 'AxiosRequestConfig'],
          },
        ],
        isAsync: false,
        isConstructor: true,
        overloads: [
          {
            arguments: [
              {
                name: 'baseUrl',
                type: TypeScriptType.STRING,
              },
            ],
          },
          {
            arguments: [
              {
                name: 'config',
                type: 'AxiosRequestConfig',
              },
            ],
          },
        ],
        returnType: TypeScriptType.THIS,
      },
      name: 'constructor',
      returnType: TypeScriptType.THIS,
    };
  }

  buildMainClass(): SwaxiosClass {
    return {
      constructor: this.buildConstructor(),
      description: this.spec.info.description,
      functions: [
        {
          content: '// ...',
          getter: true,
          name: 'rest',
        },
        {
          content: 'return this.httpClient.defaults',
          getter: true,
          name: 'defaults',
        },
        {
          content: 'return this.httpClient.interceptors',
          getter: true,
          name: 'interceptors',
        },
      ],
      name: 'APIClient',
      values: [
        {
          isPrivate: true,
          isReadonly: true,
          name: 'httpClient',
          type: 'AxiosInstance',
        },
      ],
    };
  }
}
