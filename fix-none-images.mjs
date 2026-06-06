import sharp from 'sharp';
import { resolve } from 'path';

const base = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images';

const noneImages = [
  `${base}/back/none.jpg`,
  `${base}/bias_cutting/none.jpg`,
  `${base}/button_on_collar_stand/none.jpg`,
  `${base}/collar_splicing/none.jpg`,
  `${base}/collar_stand_height/none.jpg`,
  `${base}/collar_stay/none.jpg`,
  `${base}/cuff_splicing/none.jpg`,
  `${base}/decoration_stitching_on_collar/none.jpg`,
  `${base}/decoration_stitching_on_placket/none.jpg`,
  `${base}/epaulet/none.jpg`,
  `${base}/pocket/none.jpg`,
  `${base}/sleeve_tab/none.jpg`,
];

const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="#f8f8f8" rx="4"/>
  <line x1="0" y1="0" x2="300" y2="300" stroke="#d0d0d0" stroke-width="1.5"/>
  <line x1="300" y1="0" x2="0" y2="300" stroke="#d0d0d0" stroke-width="1.5"/>
  <text
    x="150" y="155"
    font-family="Arial, Helvetica, sans-serif"
    font-size="36"
    font-weight="600"
    fill="#888888"
    text-anchor="middle"
    dominant-baseline="middle"
  >None</text>
</svg>`;

for (const imgPath of noneImages) {
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 92 })
    .toFile(imgPath);
  console.log('✓', imgPath.split('/').slice(-2).join('/'));
}

console.log('\nDone — all none.jpg files updated.');
