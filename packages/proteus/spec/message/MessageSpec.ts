/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

/* eslint-disable no-magic-numbers */

import * as Proteus from '@wireapp/proteus';
import * as sodium from 'libsodium-wrappers-sumo';

beforeAll(async () => {
  await sodium.ready;
});

describe('Message', () => {
  const st = Proteus.message.SessionTag.new();
  st.tag.fill(42);

  const bk = Proteus.keys.DHPublicKey.new(
    // prettier-ignore
    new Uint8Array([138, 143, 203, 166, 15, 89, 204, 245, 86, 121, 185, 30, 160, 41, 24, 52, 50, 97, 146, 103, 191, 106, 196, 240, 137, 183, 188, 224, 219, 194, 248, 14]),
  );
  const rk = Proteus.keys.DHPublicKey.new(
    // prettier-ignore
    new Uint8Array([49, 228, 82, 115, 149, 255, 38, 229, 18, 76, 35, 238, 21, 197, 138, 175, 183, 164, 41, 115, 46, 202, 24, 126, 74, 44, 147, 144, 182, 23, 48, 46]),
  );
  const ik_pk = Proteus.keys.IdentityPublicKey.new(
    // prettier-ignore
    new Uint8Array([226, 201, 222, 33, 39, 107, 40, 144, 176, 61, 100, 172, 187, 75, 226, 187, 56, 224, 93, 172, 160, 59, 23, 5, 89, 135, 147, 150, 186, 35, 251, 244]),
    // prettier-ignore
    new Uint8Array([239, 255, 64, 169, 64, 181, 174, 73, 140, 59, 238, 132, 78, 180, 124, 168, 31, 86, 109, 137, 143, 133, 99, 134, 196, 21, 48, 194, 228, 57, 143, 97]),
  );
  const ik = Proteus.keys.IdentityKey.new(ik_pk);

  it('serialises and deserialises a CipherMessage correctly', () => {
    const expected =
      '01a500502a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a010c020d03a101582031e4527395ff26e5124c23ee15c58aafb7a429732eca187e4a2c9390b617302e044a0102030405060708090a';

    const msg = Proteus.message.CipherMessage.new(st, 12, 13, rk, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));

    const bytes = new Uint8Array(msg.serialise());
    expect(expected).toBe(sodium.to_hex(bytes).toLowerCase());

    const deserialised = Proteus.message.Message.deserialise(bytes.buffer) as Proteus.message.CipherMessage;
    expect(deserialised.constructor).toBe(Proteus.message.CipherMessage);
    expect(deserialised.ratchet_key.fingerprint()).toBe(rk.fingerprint());
  });

  it('serialises a PreKeyMessage correctly', () => {
    const expected =
      '02a400181801a10158208a8fcba60f59ccf55679b91ea029183432619267bf6ac4f089b7bce0dbc2f80e02a100a2005820e2c9de21276b2890b03d64acbb4be2bb38e05daca03b170559879396ba23fbf4015820efff40a940b5ae498c3bee844eb47ca81f566d898f856386c41530c2e4398f6103a500502a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a010c020d03a101582031e4527395ff26e5124c23ee15c58aafb7a429732eca187e4a2c9390b617302e044a0102030405060708090a';

    const cmsg = Proteus.message.CipherMessage.new(st, 12, 13, rk, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    const pkmsg = Proteus.message.PreKeyMessage.new(24, bk, ik, cmsg);

    const bytes = new Uint8Array(pkmsg.serialise());
    expect(expected).toBe(sodium.to_hex(bytes).toLowerCase());

    const deserialised = Proteus.message.Message.deserialise(bytes.buffer) as Proteus.message.PreKeyMessage;
    expect(deserialised.constructor).toBe(Proteus.message.PreKeyMessage);

    expect(deserialised.base_key.fingerprint()).toBe(bk.fingerprint());
    expect(deserialised.identity_key.fingerprint()).toBe(ik.fingerprint());

    expect(deserialised.message.ratchet_key.fingerprint()).toBe(rk.fingerprint());
  });
});
