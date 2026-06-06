import sharp from 'sharp';

const svg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="300" fill="white"/>
  <text
    x="150" y="150"
    font-family="Arial, Helvetica, sans-serif"
    font-size="40"
    font-weight="400"
    fill="#cc1a1a"
    text-anchor="middle"
    dominant-baseline="middle"
  >Matching</text>
</svg>`;

const dest = 'C:/Users/ChaseStanley/Downloads/files/brand_assets/blessed-dressed/public/images/buttoning_thread_color/matching-to-fabric.jpg';

await sharp(Buffer.from(svg))
  .jpeg({ quality: 92 })
  .toFile(dest);

console.log('Done —', dest.split('/').slice(-2).join('/'));
