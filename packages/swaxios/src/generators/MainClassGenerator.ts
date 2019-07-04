import {SwaxiosClass} from '../definitions';
import {Spec} from 'swagger-schema-official';

export class MainClassGenerator {
  private readonly spec: Spec;

  constructor(spec: Spec) {
    this.spec = spec;
  }

  buildMainClass(): SwaxiosClass {
    return '' as any;
  }
}
