// usage: node zoom.mjs <in> <out.png> <scale> [left top width height]  (fractions 0..1)
import sharp from 'sharp';
const [inp, outp, scaleStr, l, t, w, h] = process.argv.slice(2);
const scale = parseFloat(scaleStr || '3');
let img = sharp(inp);
const meta = await img.metadata();
if (l !== undefined) {
  const left = Math.round(meta.width * parseFloat(l));
  const top = Math.round(meta.height * parseFloat(t));
  const width = Math.round(meta.width * parseFloat(w));
  const height = Math.round(meta.height * parseFloat(h));
  img = img.extract({ left, top, width, height });
}
const buf = await img.png().toBuffer();
const m2 = await sharp(buf).metadata();
await sharp(buf)
  .resize(Math.round(m2.width * scale), Math.round(m2.height * scale), { kernel: 'lanczos3' })
  .png()
  .toFile(outp);
console.log(`${outp} src=${meta.width}x${meta.height} out=${Math.round(m2.width * scale)}x${Math.round(m2.height * scale)}`);
