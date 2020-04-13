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

//import * as Proteus from '@wireapp/proteus';
import * as Proteus from '../../src/main';
import * as sodium from 'libsodium-wrappers-sumo';

beforeAll(async () => {
  await sodium.ready;
});

describe('IdentityKey', () => {
  it('serialises and deserialises', async () => {
    const ikp = await Proteus.keys.IdentityKeyPair.new();
    const id = ikp.public_key;
    const id_bytes = id.serialise();
    const id_deser = Proteus.keys.IdentityKey.deserialise(id_bytes);

    expect(id.public_key.fingerprint()).toBe(id_deser.fingerprint());
    expect(sodium.to_hex(new Uint8Array(id_bytes))).toBe(sodium.to_hex(new Uint8Array(id_deser.serialise())));
  });
});
