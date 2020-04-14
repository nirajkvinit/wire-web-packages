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

import * as ClassUtil from '../util/ClassUtil';
import {IdentityPublicKey} from './IdentityPublicKey';

/**
 * Construct a long-term identity key pair.
 *
 * Every client has a long-term identity key pair.
 * Long-term identity keys are used to initialise "sessions" with other clients (triple DH).
 */
export class IdentityKey {
  public_key: IdentityPublicKey;

  constructor() {
    this.public_key = new IdentityPublicKey();
  }

  static new(public_key: IdentityPublicKey): IdentityKey {
    const key = ClassUtil.new_instance(IdentityKey);
    key.public_key = public_key;
    return key;
  }

  fingerprint(): string {
    return this.public_key.fingerprint();
  }

  /**
   * This function can be used to verify a message signature.
   *
   * @param signature The signature to verify
   * @param message The message from which the signature was computed.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verify(signature: Uint8Array, message: Uint8Array | string): boolean {
    return this.public_key.verify(signature, message);
  }

  serialise(): ArrayBuffer {
    const encoder = new CBOR.Encoder();
    this.encode(encoder);
    return encoder.get_buffer();
  }

  static deserialise(buf: ArrayBuffer): IdentityKey {
    const decoder = new CBOR.Decoder(buf);
    return IdentityKey.decode(decoder);
  }

  encode(encoder: CBOR.Encoder): CBOR.Encoder {
    encoder.object(1);
    encoder.u8(0);
    return this.public_key.encode(encoder);
  }

  static decode(decoder: CBOR.Decoder): IdentityKey {
    let public_key = ClassUtil.new_instance(IdentityPublicKey);

    const nprops = decoder.object();
    for (let index = 0; index <= nprops - 1; index++) {
      switch (decoder.u8()) {
        case 0:
          public_key = IdentityPublicKey.decode(decoder);
          break;
        default:
          decoder.skip();
      }
    }

    return IdentityKey.new(public_key);
  }
}
