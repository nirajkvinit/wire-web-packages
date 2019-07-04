import {Spec} from 'swagger-schema-official';
import {SwaxiosInterface} from '../definitions';
import {InterfaceGenerator} from './InterfaceGenerator';

export class InterfacesGenerator {
  private readonly spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
  }

  buildInterfaces(): SwaxiosInterface[] {
    if (this.spec.definitions) {
      return Object.entries(this.spec.definitions).map(([name, definition]) => {
        return new InterfaceGenerator(name, definition).buildInterface();
      });
    }

    return [];
  }
}
