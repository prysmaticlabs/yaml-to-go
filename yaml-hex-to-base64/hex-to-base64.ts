import YAML from 'yaml';
import { Buffer as ImportedBuffer } from "buffer";

export function yamlHexToBase64(input: string): string {
  const data = YAML.parse(input);
  
  parse(data);

  return YAML.stringify(data);
}

// Parse a piece of data, if the data has a string field and that string field
// is a hex encoded string, overwrite that field with base64 value.
function parse(data: any) {
  for (let key in data) {
    const val = data[key];
    if (typeof val === "string" && val.startsWith("0x")) {
      data[key] = Buffer.from(val.slice(2), 'hex').toString('Base64');
    } else if (typeof val === "object") {
      parse(val);
    }
  }
}

