import {Spec} from 'swagger-schema-official';
import {SwaxiosClass, SwaxiosInterface} from '../definitions';
import {InterfacesGenerator} from './InterfacesGenerator';
import {ClassesGenerator} from './ClassesGenerator';
import {MainClassGenerator} from './MainClassGenerator';

export class APIClientGenerator {
  private readonly spec: Spec;
  private readonly interfacesGenerator: InterfacesGenerator;
  private readonly classesGenerator: ClassesGenerator;
  private readonly mainClassGenerator: MainClassGenerator;

  constructor(spec: Spec) {
    this.spec = spec;
    this.interfacesGenerator = new InterfacesGenerator(this.spec);
    this.classesGenerator = new ClassesGenerator(this.spec);
    this.mainClassGenerator = new MainClassGenerator(this.spec);
  }

  buildInterfaces(): SwaxiosInterface[] {
    return this.interfacesGenerator.buildInterfaces()
  }

  buildClasses(): SwaxiosClass[] {
    return this.classesGenerator.buildClasses();
  }

  buildMainClass(): SwaxiosClass {
    return this.mainClassGenerator.buildMainClass();
  }
}
