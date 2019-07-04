import {Path} from 'swagger-schema-official';
import {SwaxiosClass} from '../definitions';

export class ClassGenerator {
  private readonly name: string;
  private readonly path: Path;

  constructor(name: string, path: Path) {
    this.name = name;
    this.path = path;
  }

  buildClass(): SwaxiosClass {
    return '' as any;
  }
}
