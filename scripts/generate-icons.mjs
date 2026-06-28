/**
 * Build full-bleed PWA icons from dm_logo.png.
 * The source PNG has transparent corners; Android/iOS fill those with
 * manifest background_color (cream), which shows as a white ring on home screen.
 */
import sharp from 'sharp';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const source = path.join(root, 'public', 'dm_logo.png');
const backup = path.join(root, 'public', 'dm_logo.source.png');

/** Brand dark brown — matches header / dark theme */
const BG = { r: 24, g: 20, b: 16, alpha: 255 };

async function buildIcon(size, logoScale = 0.96) {
  const inner = Math.round(size * logoScale);
  const pad = Math.round((size - inner) / 2);
  const trimmed = await sharp(source).trim({ threshold: 20 }).toBuffer();
  return sharp(trimmed)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .extend({
      top: pad,
      bottom: size - pad - inner,
      left: pad,
      right: size - pad - inner,
      background: BG,
    })
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(path.join(root, 'public'), { recursive: true });
  await copyFile(source, backup);

  const outputs = [
    { file: 'dm_logo.png', size: 512, scale: 0.96 },
    { file: 'apple-touch-icon.png', size: 180, scale: 0.96 },
    { file: 'icon-192.png', size: 192, scale: 0.96 },
    { file: 'icon-512.png', size: 512, scale: 0.96 },
  ];

  for (const { file, size, scale } of outputs) {
    const buf = await buildIcon(size, scale);
    await sharp(buf).toFile(path.join(root, 'public', file));
    console.log(`Wrote public/${file} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
