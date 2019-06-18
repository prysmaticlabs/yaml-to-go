import { Buffer as ImportedBuffer } from "buffer";

const re = RegExp(/0x[a-fA-F0-9]+/, 'g');

export function yamlHexToBase64(input: string): string {
  return input.replace(re, (match) => {
    return Buffer.from(match.slice(2), 'hex').toString('Base64');
  });
}

