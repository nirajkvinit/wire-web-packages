/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

import {CRUDEngine, Entity} from './CRUDEngine';
import {RecordAlreadyExistsError, RecordNotFoundError, RecordTypeError} from './error/';

export {Entity} from './CRUDEngine';
export type MemoryStore = Record<string, Record<string, any>>;

export class MemoryEngine implements CRUDEngine<MemoryStore> {
  public storeName = '';
  private readonly stores: MemoryStore = {};

  public async isSupported(): Promise<void> {
    // Always available
  }

  public async init(storeName: string): Promise<MemoryStore> {
    this.storeName = storeName;
    this.stores[this.storeName] = this.stores[this.storeName] || {};
    return this.stores;
  }

  public async purge(): Promise<void> {
    delete this.stores[this.storeName];
  }

  private prepareTable(tableName: string): void {
    if (!this.stores[this.storeName][tableName]) {
      this.stores[this.storeName][tableName] = {};
    }
  }

  public create<T extends Entity>(tableName: string, primaryKey: string, entity: T): Promise<string> {
    if (entity) {
      this.prepareTable(tableName);

      const record = this.stores[this.storeName][tableName][primaryKey];

      if (record) {
        const message = `Record "${primaryKey}" already exists in "${tableName}". You need to delete the record first if you want to overwrite it.`;
        const error = new RecordAlreadyExistsError(message);
        return Promise.reject(error);
      }

      this.stores[this.storeName][tableName][primaryKey] = entity;
      return Promise.resolve(primaryKey);
    }

    const message = `Record "${primaryKey}" cannot be saved in "${tableName}" because it's "undefined" or "null".`;
    return Promise.reject(new RecordTypeError(message));
  }

  public async delete(tableName: string, primaryKey: string): Promise<string> {
    this.prepareTable(tableName);
    delete this.stores[this.storeName][tableName][primaryKey];
    return primaryKey;
  }

  public async deleteAll(tableName: string): Promise<boolean> {
    delete this.stores[this.storeName][tableName];
    return true;
  }

  public read<T extends Entity>(tableName: string, primaryKey: string): Promise<T> {
    this.prepareTable(tableName);
    if (this.stores[this.storeName][tableName].hasOwnProperty(primaryKey)) {
      return Promise.resolve(this.stores[this.storeName][tableName][primaryKey]);
    } else {
      const message = `Record "${primaryKey}" in "${tableName}" could not be found.`;
      return Promise.reject(new RecordNotFoundError(message));
    }
  }

  public readAll<T extends Entity>(tableName: string): Promise<T[]> {
    this.prepareTable(tableName);

    const promises = Object.keys(this.stores[this.storeName][tableName]).map(primaryKey =>
      this.read<T>(tableName, primaryKey)
    );

    return Promise.all(promises);
  }

  public readAllPrimaryKeys(tableName: string): Promise<string[]> {
    this.prepareTable(tableName);
    return Promise.resolve(Object.keys(this.stores[this.storeName][tableName]));
  }

  public async update<T extends Entity>(tableName: string, primaryKey: string, changes: T): Promise<string> {
    this.prepareTable(tableName);
    const entity = await this.read<T>(tableName, primaryKey);
    const updatedEntity = {...entity, ...changes};
    this.stores[this.storeName][tableName][primaryKey] = updatedEntity;
    return primaryKey;
  }

  public async updateOrCreate<T extends Entity>(tableName: string, primaryKey: string, changes: T): Promise<string> {
    this.prepareTable(tableName);

    try {
      await this.update<T>(tableName, primaryKey, changes);
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        return this.create<T>(tableName, primaryKey, changes);
      }
      throw error;
    }
    return primaryKey;
  }

  async append(tableName: string, primaryKey: string, additions: string): Promise<string> {
    this.prepareTable(tableName);

    let record = await this.read<string>(tableName, primaryKey);

    if (typeof record === 'string') {
      record += additions;
    } else {
      const message = `Cannot append text to record "${primaryKey}" because it's not a string.`;
      throw new RecordTypeError(message);
    }

    this.stores[this.storeName][tableName][primaryKey] = record;
    return primaryKey;
  }
}
