import {SwaxiosClass} from '../definitions';
import {Spec} from 'swagger-schema-official';
import {ClassGenerator} from './ClassGenerator';

export class ClassesGenerator {
  private readonly spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
  }

  buildClasses(): SwaxiosClass[] {
    return Object.entries(this.spec.paths).map(([name, path]) => {
      return new ClassGenerator(name, path).buildClass()
    })
  }
}
