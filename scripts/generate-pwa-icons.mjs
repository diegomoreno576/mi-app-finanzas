import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#7c3aed"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffffff" stroke-width="28"/>
  <text x="256" y="290" font-family="system-ui, sans-serif" font-size="160" font-weight="700" text-anchor="middle" fill="#ffffff">€</text>
</svg>`;

const sizes = [192, 512, 180];

await mkdir("public/icons", { recursive: true });

for (const size of sizes) {
  const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  await writeFile(`public/icons/${name}`, buffer);
  console.log(`Generated public/icons/${name}`);
}
