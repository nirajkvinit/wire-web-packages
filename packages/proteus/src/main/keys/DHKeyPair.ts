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
import * as _sodium from 'libsodium-wrappers-sumo';

import {DHPublicKey} from './DHPublicKey';
import {DHSecretKey} from './DHSecretKey';
import * as RandomUtil from '../util/RandomUtil';

/** Construct an ephemeral key pair. */
export class DHKeyPair {
  public_key: DHPublicKey;
  secret_key: DHSecretKey;

  constructor(public_key: DHPublicKey = new DHPublicKey(), secret_key: DHSecretKey = new DHSecretKey()) {
    this.public_key = public_key;
    this.secret_key = secret_key;
  }

  static async new(): Promise<DHKeyPair> {
    await _sodium.ready;
    const sodium = _sodium;

    const secret_key_bytes = RandomUtil.random_bytes(sodium.crypto_scalarmult_SCALARBYTES);
    const secret_key = DHSecretKey.new(secret_key_bytes);
    const public_key = DHPublicKey.new(sodium.crypto_scalarmult_base(secret_key_bytes));

    return new DHKeyPair(public_key, secret_key);
  }

  encode(encoder: CBOR.Encoder): CBOR.Encoder {
    encoder.object(2);

    encoder.u8(0);
    this.secret_key.encode(encoder);

    encoder.u8(1);
    return this.public_key.encode(encoder);
  }

  static decode(decoder: CBOR.Decoder): DHKeyPair {
    const self = new DHKeyPair();

    const properties = decoder.object();
    for (let index = 0; index <= properties - 1; index++) {
      switch (decoder.u8()) {
        case 0:
          self.secret_key = DHSecretKey.decode(decoder);
          break;
        case 1:
          self.public_key = DHPublicKey.decode(decoder);
          break;
        default:
          decoder.skip();
      }
    }

    return self;
  }
}
