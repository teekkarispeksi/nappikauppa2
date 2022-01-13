import { createHash } from 'crypto';

/** Computes md5 hash from input and returns it as hex string */
export function md5(inp: string): string {
  return createHash('md5').update(inp).digest('hex');
}

/** Computes sha256 hash from input and returns it as hex string */
export function sha256(inp: string): string {
  return createHash('sha256').update(inp).digest('hex');
}

/** Converts base64 string to string */
export function fromBase64(str: string): string {
  return Buffer.from(str, 'base64').toString('binary');
}

/** Converts string to base64 encoded representation */
export function toBase64(str: string): string {
  const buf = Buffer.from(str, 'binary');
  return buf.toString('base64')
}
