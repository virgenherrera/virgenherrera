import { encodePrivateHash } from '../helpers/hash-encoder.js';

export const PRIVATE_VIEW = {
  email: 'test@example.com',
  phone: '+52 33 0000 0000',
  hash: encodePrivateHash('test@example.com', '+52 33 0000 0000'),
} as const;

export const INVALID_HASH = 'not-valid-base64';
