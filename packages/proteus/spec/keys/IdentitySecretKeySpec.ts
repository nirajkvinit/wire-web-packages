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

describe('IdentitySecretKey', () => {
  it('serialises and deserialises', async () => {
    const ikp = await Proteus.keys.IdentityKeyPair.new();
    const sk = ikp.secret_key;
    const sk_bytes = sk.serialise();
    const sk_deser = Proteus.keys.IdentitySecretKey.deserialise(sk_bytes);

    //expect(ikp.public_key.fingerprint()).toBe(ikp_deser.public_key.fingerprint());
    expect(sodium.to_hex(new Uint8Array(sk_bytes))).toBe(sodium.to_hex(new Uint8Array(sk_deser.serialise())));
  });
});
