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
import * as sodium from 'libsodium-wrappers-sumo';

import { InputError } from '../errors/InputError';
import * as ClassUtil from '../util/ClassUtil';

export class IdentityPublicKey {
  pub_edward: Uint8Array;
  pub_curve: Uint8Array;

  constructor() {
    this.pub_edward = new Uint8Array([]);
    this.pub_curve = new Uint8Array([]);
  }

  static new(pub_edward: Uint8Array, pub_curve: Uint8Array): IdentityPublicKey {
    const pk = ClassUtil.new_instance(IdentityPublicKey);

    pk.pub_edward = pub_edward;
    pk.pub_curve = pub_curve;
    return pk;
  }

  /**
   * This function can be used to verify a message signature.
   *
   * @param signature The signature to verify
   * @param message The message from which the signature was computed.
   * @returns `true` if the signature is valid, `false` otherwise.
   */
  verify(signature: Uint8Array, message: Uint8Array | string): boolean {
    return sodium.crypto_sign_verify_detached(signature, message, this.pub_edward);
  }

  fingerprint(): string {
    return sodium.to_hex(this.pub_edward);
  }

  serialise(): ArrayBuffer {
    const encoder = new CBOR.Encoder();
    this.encode(encoder);
    return encoder.get_buffer();
  }

  static deserialise(buf: ArrayBuffer): IdentityPublicKey {
    const decoder = new CBOR.Decoder(buf);
    return IdentityPublicKey.decode(decoder);
  }

  encode(encoder: CBOR.Encoder): CBOR.Encoder {
    encoder.object(2);
    encoder.u8(0);
    encoder.bytes(this.pub_edward);
    encoder.u8(1);
    return encoder.bytes(this.pub_curve);
  }

  static decode(decoder: CBOR.Decoder): IdentityPublicKey {
    const self = ClassUtil.new_instance(IdentityPublicKey);

    const nprops = decoder.object();
    let pub_edward;
    let pub_curve;
    for (let index = 0; index <= nprops - 1; index++) {
      switch (decoder.u8()) {
        case 0:
          pub_edward = new Uint8Array(decoder.bytes());
          break;
        case 1:
          pub_curve = new Uint8Array(decoder.bytes());
          break;
        default:
          decoder.skip();
      }
    }

    if (pub_edward) {
      self.pub_edward = pub_edward;
      if (!pub_curve) {
        self.pub_curve = sodium.crypto_sign_ed25519_pk_to_curve25519(pub_edward);
      } else {
        self.pub_curve = pub_curve;
      }
    } else {
      throw new InputError.ConversionError('Could not convert public key with ed2curve.', 409);
    }
    return self;
  }
}
