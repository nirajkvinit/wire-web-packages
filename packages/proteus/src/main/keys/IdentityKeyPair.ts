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

import * as CBOR from '@wireapp/cbor';
import * as _sodium from 'libsodium-wrappers-sumo';
import * as ClassUtil from '../util/ClassUtil';
import { IdentityKey } from './IdentityKey';
import { IdentitySecretKey } from './IdentitySecretKey';
import { IdentityPublicKey } from './IdentityPublicKey';

export class IdentityKeyPair {
  public_key: IdentityKey;
  secret_key: IdentitySecretKey;
  version: number;

  constructor() {
    this.public_key = new IdentityKey();
    this.secret_key = new IdentitySecretKey();
    this.version = -1;
  }

  static async new(): Promise<IdentityKeyPair> {
    await _sodium.ready;
    const sodium = _sodium;

    const ed25519_key_pair = sodium.crypto_sign_keypair();
    const sec_edward = ed25519_key_pair.privateKey;
    const pub_edward = ed25519_key_pair.publicKey;

    const sec_curve = sodium.crypto_sign_ed25519_sk_to_curve25519(sec_edward);
    const pub_curve = sodium.crypto_sign_ed25519_pk_to_curve25519(pub_edward);

    let identity_secret_key = new IdentitySecretKey();
    identity_secret_key.sec_edward = sec_edward;
    identity_secret_key.sec_curve = sec_curve;

    let identity_public_key = new IdentityPublicKey();
    identity_public_key.pub_edward = pub_edward;
    identity_public_key.pub_curve = pub_curve;

    const ikp = ClassUtil.new_instance(IdentityKeyPair);
    ikp.version = 2;
    ikp.secret_key = identity_secret_key;
    ikp.public_key = IdentityKey.new(identity_public_key);

    return ikp;
  }

  serialise(): ArrayBuffer {
    const encoder = new CBOR.Encoder();
    this.encode(encoder);
    return encoder.get_buffer();
  }

  static deserialise(buf: ArrayBuffer): IdentityKeyPair {
    const decoder = new CBOR.Decoder(buf);
    return IdentityKeyPair.decode(decoder);
  }

  encode(encoder: CBOR.Encoder): CBOR.Encoder {
    encoder.object(3);
    encoder.u8(0);
    encoder.u8(this.version);
    encoder.u8(1);
    this.secret_key.encode(encoder);
    encoder.u8(2);
    return this.public_key.encode(encoder);
  }

  static decode(decoder: CBOR.Decoder): IdentityKeyPair {
    const self = ClassUtil.new_instance(IdentityKeyPair);

    const nprops = decoder.object();
    for (let index = 0; index <= nprops - 1; index++) {
      switch (decoder.u8()) {
        case 0:
          self.version = decoder.u8();
          break;
        case 1:
          self.secret_key = IdentitySecretKey.decode(decoder);
          break;
        case 2:
          self.public_key = IdentityKey.decode(decoder);
          break;
        default:
          decoder.skip();
      }
    }

    return self;
  }
}
