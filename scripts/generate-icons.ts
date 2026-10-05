/**
 * Builds the app icons in /public from the Ruhama mark (run: npx tsx scripts/generate-icons.ts).
 * Outputs are committed, so this only needs re-running when the mark or colours change.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

const MARK =
  'M24 5Q32.78 20.36 37.43 37.43Q20.36 32.78 5 24Q20.36 15.22 37.43 10.57Q32.78 27.64 24 43Q15.22 27.64 10.57 10.57Q27.64 15.22 43 24Q27.64 32.78 10.57 37.43Q15.22 20.36 24 5Z'

const TEAL = '#0E4D45'
const GOLD = '#D4A95C'

/** `pad` is the share of the canvas kept clear around the mark (maskable icons need ~20%). */
function svg({ size, pad, rounded }: { size: number; pad: number; rounded: boolean }) {
  const inner = size * (1 - pad * 2)
  const scale = inner / 48
  const offset = size * pad
  const radius = rounded ? size * 0.22 : 0
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${TEAL}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${MARK}" fill="none" stroke="${GOLD}" stroke-width="2.4" stroke-linejoin="round"/>
  </g>
</svg>`
}

const out = path.resolve(process.cwd(), 'public')
mkdirSync(out, { recursive: true })

writeFileSync(path.join(out, 'icon.svg'), svg({ size: 512, pad: 0.16, rounded: true }))

const targets: { file: string; size: number; pad: number; rounded: boolean }[] = [
  { file: 'icon-192.png', size: 192, pad: 0.16, rounded: true },
  { file: 'icon-512.png', size: 512, pad: 0.16, rounded: true },
  { file: 'icon-maskable-512.png', size: 512, pad: 0.24, rounded: false },
  { file: 'apple-touch-icon.png', size: 180, pad: 0.18, rounded: false },
  { file: 'favicon-32.png', size: 32, pad: 0.1, rounded: true },
]

for (const t of targets) {
  await sharp(Buffer.from(svg(t)))
    .png()
    .toFile(path.join(out, t.file))
  console.log('wrote', t.file)
}
