import {TypeScriptType, SwaggerType} from '../definitions';

export class TypeGenerator {
  constructor() {}

  buildType(type?: string): TypeScriptType {
    switch (type) {
      case SwaggerType.INTEGER:
      case SwaggerType.NUMBER: {
        return TypeScriptType.NUMBER;
      }
      case SwaggerType.STRING: {
        return TypeScriptType.STRING;
      }
      default: {
        return TypeScriptType.ANY;
      }
    }
  }
}
