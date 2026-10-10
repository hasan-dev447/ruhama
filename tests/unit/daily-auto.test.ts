import { describe, expect, it } from 'vitest'

import { DAILY_THEMES, hadithWords, themeOf } from '@/server/queries/daily-auto'

describe('hadithWords', () => {
  it('keeps only the Prophet’s words, without the narrators or the publisher’s note', () => {
    const text =
      'মুহাম্মাদ ইবনু বাশশার আল আবদী (রহঃ) ..... সাবিত (রহঃ) থেকে বর্ণিত। তিনি বলেন, আমি আনাস ইবনু মালিক (রাযিঃ) কে বলতে শুনেছি, রসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম বলেছেনঃ প্রথম আঘাতেই ধৈর্য ধারণ করা হচ্ছে প্রকৃত ধৈর্য। (ইসলামী ফাউন্ডেশন ২০০৮, ইসলামীক সেন্টার)'
    expect(hadithWords(text)).toBe('প্রথম আঘাতেই ধৈর্য ধারণ করা হচ্ছে প্রকৃত ধৈর্য।')
  })

  it('takes the opening after the Prophet’s name, not a narrator’s', () => {
    const text =
      'আবূ দারদা (রাঃ) থেকে বর্ণিত। তিনি বলেনঃ আমি রাসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম -কে বলতে শুনেছিঃ নিশ্চয় আসমান ও যমীনের অধিবাসীগণ জ্ঞানীর জন্য ক্ষমা প্রার্থনা করে।'
    expect(hadithWords(text)).toBe(
      'নিশ্চয় আসমান ও যমীনের অধিবাসীগণ জ্ঞানীর জন্য ক্ষমা প্রার্থনা করে।',
    )
  })

  it('gives nothing when there is no clear opening', () => {
    expect(hadithWords('উমার (রাঃ) থেকে বর্ণিত, তিনি সালাত আদায় করলেন।')).toBeNull()
  })
})

describe('themeOf', () => {
  it('is the same all day and moves to the next theme the next day', () => {
    const a = themeOf('2026-10-07')
    expect(themeOf('2026-10-07')).toBe(a)
    const i = DAILY_THEMES.indexOf(a)
    expect(themeOf('2026-10-08')).toBe(DAILY_THEMES[(i + 1) % DAILY_THEMES.length])
  })
})

describe('hadithWords notes', () => {
  it('drops footnote marks and grading remarks at the end, keeping the full stop', () => {
    expect(
      hadithWords(
        'রাসূলুল্লাহ সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম বলেছেনঃ তোমরা খাবার খাওয়াও এবং সালামের প্রচলন ঘটাও। সহীহ, ইবনু মা-জাহ (৩৬৯৪) এ হাদীসটিকে আবূ ঈসা হাসান সহীহ বলেছেন।',
      ),
    ).toBe('তোমরা খাবার খাওয়াও এবং সালামের প্রচলন ঘটাও।')
    expect(
      hadithWords('নবী সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম বলেছেনঃ তার জন্য কতই না মঙ্গল![1] সহীহ।'),
    ).toBe('তার জন্য কতই না মঙ্গল!')
    expect(
      hadithWords(
        'নবী সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম বলেনঃ কবুল হাজের প্রতিদান জান্নাত ছাড়া আর কিছু নেই।: সহীহ, ইবনু মা-জাহ (২৮৮৮)',
      ),
    ).toBe('কবুল হাজের প্রতিদান জান্নাত ছাড়া আর কিছু নেই।')
  })
})
