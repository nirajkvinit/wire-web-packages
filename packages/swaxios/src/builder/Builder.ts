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
import {IndentationText, Project, QuoteKind, SourceFile} from 'ts-morph';

import {ClassesBuilder} from './ClassesBuilder';
import {InterfaceBuilder} from './InterfacesBuilder';
import {MainClassBuilder} from './MainClassBuilder';

export class Builder {
  public classes?: SourceFile[];
  public interfaces?: SourceFile[];
  public mainClass: SourceFile;
  private readonly spec: Spec;
  private readonly project: Project;
  private readonly outputDir: string;
  private readonly separateFiles?: boolean;

  constructor(spec: Spec, outputDir: string, separateFiles?: boolean) {
    this.spec = spec;
    this.outputDir = outputDir;
    this.separateFiles = separateFiles;

    this.project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
    });

    this.interfaces = new InterfaceBuilder(
      this.spec,
      this.project,
      this.outputDir,
      this.separateFiles
    ).buildInterfaces();
    this.classes = new ClassesBuilder(this.spec, this.project, this.outputDir, this.separateFiles).buildClasses();
    this.mainClass = new MainClassBuilder(this.spec, this.project, this.outputDir).buildMainClass();
  }

  public save(): Promise<void> {
    return this.project.save();
  }
}
