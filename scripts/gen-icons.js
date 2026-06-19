import sharp from 'sharp';
import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS = join(__dirname, '..', 'static', 'icons');

async function render(src, out, size) {
  const svg = await readFile(join(ICONS, src));
  const buf = await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(join(ICONS, out), buf);
  console.log('wrote', out, size);
}

await render('icon-source.svg', 'icon-192.png', 192);
await render('icon-source.svg', 'icon-512.png', 512);
await render('icon-maskable-source.svg', 'icon-maskable-512.png', 512);
await render('icon-source.svg', 'apple-touch-icon.png', 180);
await render('icon-source.svg', 'favicon.png', 64);

const fav = await readFile(join(ICONS, 'favicon.png'));
await writeFile(join(ICONS, '..', 'favicon.png'), fav);
console.log('done');
