import type { SecretsPayload } from '@vh/profile';
import { encodePrivateHash } from '../helpers/hash-encoder.js';

export const DECODED_SENSITIVE_DATA = {
  email: 'test@example.com',
  phone: '+52 33 0000 0000',
} satisfies SecretsPayload;

export const PRIVATE_HASH = encodePrivateHash(
  DECODED_SENSITIVE_DATA.email,
  DECODED_SENSITIVE_DATA.phone,
);

export const INVALID_HASH = 'not-valid-base64';
