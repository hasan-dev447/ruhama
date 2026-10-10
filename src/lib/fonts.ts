import { Amiri, Cormorant_Garamond, Noto_Sans_Bengali } from 'next/font/google'

/*
 * Self-hosted at build time by next/font; the variables feed the --rh-font-* tokens. Kept to three
 * families, each loading only what it needs:
 * - Noto Sans Bengali: all text, headings included, Bangla and Latin, with clear standard Bangla
 *   digits. One variable file covers every weight (a separate heading font cost another ~210 KB).
 * - Amiri: Arabic (ayah, hadith); not preloaded, so pages without Arabic never download it.
 * - Cormorant Garamond: the "Ruhama" wordmark only, one weight, Latin only.
 */

export const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  display: 'swap',
  variable: '--font-noto-sans-bengali',
  fallback: ['system-ui', 'sans-serif'],
})

export const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-amiri',
  preload: false,
  fallback: ['Traditional Arabic', 'serif'],
})

export const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['600'],
  display: 'swap',
  variable: '--font-cormorant',
  fallback: ['Garamond', 'Georgia', 'serif'],
})

export const fontVariables = [notoSansBengali.variable, amiri.variable, cormorant.variable].join(
  ' ',
)
