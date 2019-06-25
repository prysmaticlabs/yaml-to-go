import { Buffer as ImportedBuffer } from "buffer";

// Matching any line with a hex string.
const outer = RegExp(/^.*0x[a-fA-F0-9]*.*/, 'gm');

// Matching the hex string itself.
const inner = RegExp(/0x[a-fA-F0-9]*/, 'g');

export function yamlHexToBase64(input: string): string {
  return input.replace(outer, (match) => {
    match = match.replace(/'/g, '');

    // Special case: domain fields are supposed to be hexadecimal.
    if (match.includes('domain')) {
      return match;
    }
    return match.replace(inner, (match) => {
      return `${Buffer.from(match.slice(2), 'hex').toString('Base64')}`;
    });
  });
}

