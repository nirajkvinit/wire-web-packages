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
import {SwaxiosClass, SwaxiosInterface} from '../definitions';
import {ClassesGenerator} from './ClassesBuilder';
import {InterfacesGenerator} from './InterfacesBuilder';
import {MainClassGenerator} from './MainClassBuilder';

export class APIClientBuilder {
  private readonly spec: Spec;
  private readonly interfacesBuilder: InterfacesGenerator;
  private readonly classesBuilder: ClassesGenerator;
  private readonly mainClassBuilder: MainClassGenerator;

  constructor(spec: Spec) {
    this.spec = spec;
    this.interfacesBuilder = new InterfacesGenerator(this.spec);
    this.classesBuilder = new ClassesGenerator(this.spec);
    this.mainClassBuilder = new MainClassGenerator(this.spec);
  }

  buildInterfaces(): SwaxiosInterface[] {
    return this.interfacesBuilder.buildInterfaces();
  }

  buildClasses(): SwaxiosClass[] {
    return this.classesBuilder.buildClasses();
  }

  buildMainClass(): SwaxiosClass {
    return this.mainClassBuilder.buildMainClass();
  }
}
