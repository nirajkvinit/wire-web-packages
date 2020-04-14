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

import * as CBOR from '@wireapp/cbor';
import * as sodium from 'libsodium-wrappers-sumo';

import * as ClassUtil from '../util/ClassUtil';
import {InputError} from '../errors/InputError';
import * as ArrayUtil from '../util/ArrayUtil';
import {DHPublicKey} from './DHPublicKey';

export class DHSecretKey {
  sec_curve: Uint8Array;

  constructor() {
    this.sec_curve = new Uint8Array([]);
  }

  static new(sec_curve: Uint8Array): DHSecretKey {
    const sk = ClassUtil.new_instance(DHSecretKey);

    sk.sec_curve = sec_curve;
    return sk;
  }

  /**
   * This function can be used to compute a shared secret given a user's secret key and another
   * user's public key.
   * @param public_key Another user's public key
   * @returns Array buffer view of the computed shared secret
   */
  shared_secret(public_key: DHPublicKey): Uint8Array {
    const shared_secret = sodium.crypto_scalarmult(this.sec_curve, public_key.pub_curve);
    ArrayUtil.assert_is_not_zeros(shared_secret);
    return shared_secret;
  }

  serialise(): ArrayBuffer {
    const encoder = new CBOR.Encoder();
    this.encode(encoder);
    return encoder.get_buffer();
  }

  static deserialise(buf: ArrayBuffer): DHSecretKey {
    const decoder = new CBOR.Decoder(buf);
    return DHSecretKey.decode(decoder);
  }

  encode(encoder: CBOR.Encoder): CBOR.Encoder {
    encoder.object(1);
    encoder.u8(1);
    return encoder.bytes(this.sec_curve);
  }

  static decode(decoder: CBOR.Decoder): DHSecretKey {
    const self = ClassUtil.new_instance(DHSecretKey);

    const nprops = decoder.object();
    let sec_edward;
    let sec_curve;
    for (let index = 0; index <= nprops - 1; index++) {
      switch (decoder.u8()) {
        case 0:
          sec_edward = new Uint8Array(decoder.bytes());
          break;
        case 1:
          sec_curve = new Uint8Array(decoder.bytes());
          break;
        default:
          decoder.skip();
      }
    }

    if (!sec_curve) {
      if (sec_edward) {
        sec_curve = sodium.crypto_sign_ed25519_sk_to_curve25519(sec_edward);
      } else {
        throw new InputError.ConversionError('Could not convert secret key with libsodium.', 408);
      }
    }

    self.sec_curve = sec_curve;
    return self;
  }
}
