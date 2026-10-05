import path from 'node:path'

import sharp, { type OverlayOptions } from 'sharp'

import { SITE } from '@/lib/site'

const MARK =
  'M24 5Q32.78 20.36 37.43 37.43Q20.36 32.78 5 24Q20.36 15.22 37.43 10.57Q32.78 27.64 24 43Q15.22 27.64 10.57 10.57Q27.64 15.22 43 24Q27.64 32.78 10.57 37.43Q15.22 20.36 24 5Z'

const FONT_DIR = path.join(process.cwd(), 'node_modules/@expo-google-fonts/noto-serif-bengali')
const BOLD = path.join(FONT_DIR, '700Bold/NotoSerifBengali_700Bold.ttf')
const SEMIBOLD = path.join(FONT_DIR, '600SemiBold/NotoSerifBengali_600SemiBold.ttf')

const W = 1200
const H = 630

/** Pango markup needs &, < and > escaped. */
const markup = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Text is rendered by Pango (HarfBuzz shaping), so Bangla conjuncts and
 * pre-base vowel signs come out correctly, with real word wrapping.
 */
function textLayer(
  text: string,
  opts: { size: number; color: string; bold?: boolean; width?: number; spacing?: number },
) {
  return sharp({
    text: {
      text: `<span foreground="${opts.color}">${markup(text)}</span>`,
      font: `Noto Serif Bengali ${opts.bold ? 'Bold' : 'SemiBold'} ${opts.size}`,
      fontfile: opts.bold ? BOLD : SEMIBOLD,
      rgba: true,
      width: opts.width,
      wrap: 'word',
      spacing: opts.spacing,
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true })
}

const background = () =>
  sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0E4D45"/>
  <g transform="translate(830 -90) scale(10.8)" opacity="0.16"><path d="${MARK}" fill="none" stroke="#D4A95C" stroke-width="1.6"/></g>
  <g transform="translate(80 70) scale(1.1667)"><path d="${MARK}" fill="none" stroke="#D4A95C" stroke-width="2.4"/></g>
  <rect x="80" y="561" width="48" height="2" fill="#D4A95C"/>
</svg>`),
  )
    .png()
    .toBuffer()

/** 1200×630 share card for any page title. */
export async function renderOgImage({
  title,
  kicker,
}: {
  title: string
  kicker?: string | null
}): Promise<Buffer> {
  const size = title.length > 70 ? 46 : title.length > 40 ? 54 : 64
  const [bg, brand, heading, kick, tagline] = await Promise.all([
    background(),
    textLayer('Ruhama', { size: 36, color: '#F6F1E6', bold: true }),
    textLayer(title, {
      size,
      color: '#F6F1E6',
      bold: true,
      width: 1000,
      spacing: Math.round(size * 0.35),
    }),
    kicker ? textLayer(kicker, { size: 26, color: '#D4A95C' }) : Promise.resolve(null),
    textLayer(SITE.tagline, { size: 24, color: '#C3D9D3' }),
  ])

  // the title block sits on a fixed baseline area and grows upwards
  const headingHeight = Math.min(heading.info.height, 330)
  const headingTop = 505 - headingHeight
  const layers: OverlayOptions[] = [
    { input: brand.data, top: 76, left: 156 },
    { input: heading.data, top: headingTop, left: 80 },
    { input: tagline.data, top: 545, left: 146 },
  ]
  if (kick)
    layers.push({
      input: kick.data,
      top: Math.max(150, headingTop - kick.info.height - 14),
      left: 80,
    })

  return sharp(bg).composite(layers).png({ compressionLevel: 9 }).toBuffer()
}
