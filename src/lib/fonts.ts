import {
  Amiri,
  Cormorant_Garamond,
  Hind_Siliguri,
  Inter,
  Noto_Serif_Bengali,
} from 'next/font/google'

/* Self-hosted at build time by next/font. Variables feed the --rh-font-* tokens. */

// headings only use 600 and 700 (as in the design boards); two static files beat the full variable font
export const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-noto-serif-bengali',
  fallback: ['Noto Serif', 'Georgia', 'serif'],
})

export const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-hind-siliguri',
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

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})

export const fontVariables = [
  notoSerifBengali.variable,
  hindSiliguri.variable,
  amiri.variable,
  cormorant.variable,
  inter.variable,
].join(' ')
