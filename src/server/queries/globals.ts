import 'server-only'

import type { AboutPage, AdabPolicy, HomePage, SiteSetting } from '@/payload-types'

import { TAGS } from '../cache/tags'
import { getPayloadClient } from '../payload'
import { cached } from './cached'

export type SiteSettingsView = {
  footerBlurb: string
  newsletterBlurb: string
  footerAyah: { arabic: string; translation: string; reference: string }
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  social: { facebook: string | null; youtube: string | null; telegram: string | null }
  defaultTitle: string | null
  defaultDescription: string | null
}

const FALLBACK: SiteSettingsView = {
  footerBlurb:
    'কুরআন ও সহিহ সুন্নাহর আলোকে দলীয় পরিচয়ের ঊর্ধ্বে একটি নিরপেক্ষ ও উন্মুক্ত প্ল্যাটফর্ম।',
  newsletterBlurb:
    'প্রতি শুক্রবার একটি আয়াত, একটি হাদিস ও বাছাই করা প্রবন্ধ, সরাসরি আপনার ইনবক্সে।',
  footerAyah: {
    arabic: 'وَاللَّهُ خَيْرٌ حَافِظًا ۖ وَهُوَ أَرْحَمُ الرَّاحِمِينَ',
    translation: 'আল্লাহই সর্বোত্তম রক্ষাকারী, আর তিনিই সর্বশ্রেষ্ঠ দয়ালু।',
    reference: 'সূরা ইউসুফ : ৬৪',
  },
  contactEmail: null,
  contactPhone: null,
  address: null,
  social: { facebook: null, youtube: null, telegram: null },
  defaultTitle: null,
  defaultDescription: null,
}

export const getSiteSettings = cached(
  ['site-settings'],
  async (): Promise<SiteSettingsView> => {
    const payload = await getPayloadClient()
    const s = (await payload.findGlobal({ slug: 'site-settings', depth: 0 })) as SiteSetting
    return {
      footerBlurb: s.footerBlurb || FALLBACK.footerBlurb,
      newsletterBlurb: s.newsletterBlurb || FALLBACK.newsletterBlurb,
      footerAyah: s.footerAyah?.arabic
        ? (s.footerAyah as SiteSettingsView['footerAyah'])
        : FALLBACK.footerAyah,
      contactEmail: s.contactEmail ?? null,
      contactPhone: s.contactPhone ?? null,
      address: s.address ?? null,
      social: {
        facebook: s.social?.facebook ?? null,
        youtube: s.social?.youtube ?? null,
        telegram: s.social?.telegram ?? null,
      },
      defaultTitle: s.defaultTitle ?? null,
      defaultDescription: s.defaultDescription ?? null,
    }
  },
  { tags: [TAGS.global('site-settings')], revalidate: 86400 },
)

export const getHomePage = cached(
  ['home-page'],
  async () => {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'home-page', depth: 1 })) as HomePage
  },
  { tags: [TAGS.global('home-page'), TAGS.home], revalidate: 3600 },
)

export const getAboutPage = cached(
  ['about-page'],
  async () => {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'about-page', depth: 1 })) as AboutPage
  },
  { tags: [TAGS.global('about-page')], revalidate: 86400 },
)

export const getAdabPolicy = cached(
  ['adab-policy'],
  async () => {
    const payload = await getPayloadClient()
    return (await payload.findGlobal({ slug: 'adab-policy', depth: 0 })) as AdabPolicy
  },
  { tags: [TAGS.global('adab-policy')], revalidate: 86400 },
)
