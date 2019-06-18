import YAML from 'yaml';
import { Buffer as ImportedBuffer } from "buffer";

const MAX_UINT64 = "18446744073709551615";
const MAX_SAFE_INT_STR = "18446744073709552000";

export function yamlHexToBase64(input: string): string {
  const data = YAML.parse(input);
  
  parse(data);

  let ret = YAML.stringify(data);

  // HACK: put back max uint64.
  return ret.replace(new RegExp(MAX_SAFE_INT_STR, 'g'), MAX_UINT64);
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

