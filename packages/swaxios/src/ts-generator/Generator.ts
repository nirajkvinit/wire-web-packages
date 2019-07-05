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
import {IndentationText, NewLineKind, Project, QuoteKind, SourceFile} from 'ts-morph';

import {InterfacesGenerator} from './InterfacesGenerator';
import {MainClassGenerator} from './MainClassGenerator';
import {ServicesGenerator} from './ServicesGenerator';

export class Generator {
  public classes: SourceFile[];
  public interfaces: SourceFile[];
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
        insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: false,
        newLineKind: NewLineKind.LineFeed,
        quoteKind: QuoteKind.Single,
      },
    });

    const interfacesGenerator = new InterfacesGenerator(this.spec, this.project, this.outputDir, this.separateFiles);
    this.interfaces = interfacesGenerator.generateSourceFiles();

    const servicesGenerator = new ServicesGenerator(this.spec, this.project, this.outputDir, this.separateFiles);
    this.classes = servicesGenerator.generateSourceFiles();

    const mainClassGenerator = new MainClassGenerator(this.spec, this.project, this.outputDir, this.separateFiles);
    this.mainClass = mainClassGenerator.generateSourceFile();
  }

  public async save(): Promise<void> {
    await this.project.save();
  }
}
