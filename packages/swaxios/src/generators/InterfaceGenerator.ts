import {Schema} from 'swagger-schema-official';
import {SwaxiosInterface, SwaxiosInterfaceValue} from '../definitions';
import {TypeGenerator} from './TypeGenerator';

export class InterfaceGenerator {
  private readonly schema: Omit<Schema, '$ref' | 'enum'>;
  private readonly name: string;
  private readonly typeGenerator: TypeGenerator;

  constructor(name: string, schema: Omit<Schema, '$ref' | 'enum'>) {
    this.name = name;
    this.schema = schema;
    this.typeGenerator = new TypeGenerator();
  }

  private isRequired(keyName: string): boolean {
    if (this.schema.required) {
      return this.schema.required.includes(keyName);
    }
    return false;
  }

  private buildValues(): Record<string, SwaxiosInterfaceValue> {
    if (!this.schema.properties) {
      return {};
    }

    return Object.entries(this.schema.properties).reduce((result: Record<string, SwaxiosInterfaceValue> , [key, value]) => {
      result[key] = {
        description: value.description,
        name: key,
        required: this.isRequired(key),
        type: this.typeGenerator.buildType(value.type),
      }
      return result;
    }, {})
  }

  public buildInterface(): SwaxiosInterface {
    const result: SwaxiosInterface = {
      name: this.name,
      values: this.buildValues(),
    }

    if (this.schema.description) {
      result.description = this.schema.description;
    }

    return result;
  }
}
