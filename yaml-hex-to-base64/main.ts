import * as fs from 'fs';

import {yamlHexToBase64} from './hex-to-base64';

if (true) {
  const filepath = process.argv[2];

  const file = fs.readFileSync(filepath, 'utf8');
  const result = yamlHexToBase64(file);
  // TODO: write result.
  console.log(result);
}
