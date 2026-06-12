import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_3DyD2E81EIviG1HGaeP20VNagJz/';

// SVG filename → CloudFront filename mapping
const svgToPhoto = {
  'notch-lapel.svg':        'hf_20260611_113804_869855a9-4358-4aec-829e-c4043c2c4617.png',
  'peak-lapel.svg':         'hf_20260611_113809_c35a6790-23bb-4d19-920c-495266d54b9d.png',
  'shawl-lapel.svg':        'hf_20260611_113819_dbcac2df-4bd8-4e7a-bc77-cee2758db836.png',
  'semi-notch.svg':         'hf_20260611_113825_f42ae0fa-4835-4df0-9f9e-3ffbcb880170.png',
  'semi-peak.svg':          'hf_20260611_114038_791ca047-a5b0-43e0-9171-8d3fea1f894a.png',
  'notch-tab.svg':          'hf_20260611_114043_c208722d-68f5-4437-879a-408126e93b0f.png',
  'italian-fishtail.svg':   'hf_20260611_114048_9f87fe9e-87fb-4426-81a4-e06bb8f1a950.png',
  'patch-pocket.svg':       'hf_20260611_114053_0e89408a-c834-4571-9873-d6b1237311a8.png',
  'slanted-flap.svg':       'hf_20260611_114104_1b62e82e-b7bb-4333-8a8e-69a6ac5fd3b7.png',
  'jetted-flap-5-5cm.svg':  'hf_20260611_114109_e9c824c3-004c-409b-808e-1031f6cd8cae.png',
  'jetted-flap-6-5cm.svg':  'hf_20260611_114109_e9c824c3-004c-409b-808e-1031f6cd8cae.png',
  'jetted-no-flap.svg':     'hf_20260611_114114_7ad6b623-1bde-49c9-b10d-6e52c2852a36.png',
  'straight-welt-2-5cm.svg':'hf_20260611_114119_32757775-4f1e-4edb-92ba-3767bf5004c0.png',
  'straight-welt-2-3cm.svg':'hf_20260611_114119_32757775-4f1e-4edb-92ba-3767bf5004c0.png',
  'curved-welt-2-5cm.svg':  'hf_20260611_114134_d94d9a92-907a-4a97-ba8b-a92071c9b933.png',
  'bellows-pocket.svg':     'hf_20260611_114140_34e9870a-be31-459d-9ad9-c1642c150374.png',
  'square-cuff.svg':        'hf_20260611_114145_0a29fcc3-dbd0-4358-9f04-bb68027437aa.png',
  'round-cuff.svg':         'hf_20260611_114151_0a631617-fc95-42d1-8c9c-c1de57dc8085.png',
  'turnback-cuff.svg':      'hf_20260611_114202_67590805-66c2-4d48-8ae4-2b08dd686e93.png',
};

function getFilename(imagePath) {
  if (!imagePath) return null;
  return imagePath.split('/').pop();
}

function injectIntoFile(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  let count = 0;

  for (const section of data.sections ?? []) {
    for (const field of section.fields ?? []) {
      for (const opt of field.options ?? []) {
        const filename = getFilename(opt.image);
        if (filename && svgToPhoto[filename]) {
          opt.realImage = CDN + svgToPhoto[filename];
          count++;
        }
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`${filePath}: injected ${count} realImage fields`);
}

const targets = [
  join(__dir, 'data-store/options/suit-2pc.json'),
  join(__dir, 'data-store/options/suit-3pc.json'),
  join(__dir, 'data-store/options/sport-coat.json'),
];

for (const t of targets) {
  injectIntoFile(t);
}
