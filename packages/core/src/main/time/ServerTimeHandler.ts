/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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

import logdown from 'logdown';

export class ServerTimeHandler {
  private readonly logger: logdown.Logger;
  private timeOffset?: number;

  constructor() {
    this.logger = logdown('@wireapp/api-client/Client', {
      logger: console,
      markdown: false,
    });
  }

  public updateTimeOffset(serverTimeString: string): void {
    const timeOffset = Date.now() - new Date(serverTimeString).valueOf();
    this.timeOffset = timeOffset;
    this.logger.info(`Current backend time is "${serverTimeString}". Time offset updated to "${this.timeOffset}" ms.`);
  }

  public getTimeOffset(): number {
    if (this.timeOffset === undefined) {
      this.logger.warn('Trying to get server/client time offset, but no server time has been set.');
      return 0;
    }
    return this.timeOffset;
  }

  public getServerTimestamp(localTimestamp = Date.now()): Date {
    return new Date(localTimestamp - this.getTimeOffset());
  }
}
