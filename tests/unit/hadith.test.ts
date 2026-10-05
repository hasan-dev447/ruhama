import { describe, expect, it } from 'vitest'

import {
  cleanHadithText,
  extractNarrator,
  mapGrade,
  pickGrade,
  normalizeArabicDashes,
  normalizeDashes,
} from '@/lib/hadith'

describe('narrator extraction', () => {
  it('reads the companion at the start', () => {
    expect(extractNarrator('আনাস ইবনু মালিক (রাঃ) সূত্রে বর্ণিত। তিনি বলেন…')).toBe(
      'আনাস ইবনু মালিক (রা.)',
    )
    expect(extractNarrator('আমীরুল মুমিনীন উমার ইবন আল-খাত্তাব (রাঃ) তিনি বলেছেন…')).toBe(
      'উমার ইবন আল-খাত্তাব (রা.)',
    )
  })

  it('skips the isnad before the companion (Sahih Muslim style)', () => {
    expect(
      extractNarrator(
        'আহমাদ ইবনু উসমান আন্‌ নাওফালী (রহঃ) ..... সুলায়মান ইবনু ইয়াসার (রাযিঃ) থেকে বর্ণিত।',
      ),
    ).toBe('সুলায়মান ইবনু ইয়াসার (রা.)')
  })

  it('reads the companion after a reported clause (Muwatta style)', () => {
    expect(
      extractNarrator(
        "রেওয়ায়ত ৭. মালিক (রহঃ) বলেনঃ তাহার নিকট রেওয়ায়ত পৌছিয়াছে যে, সা'দ ইবন আবী ওয়াক্কাস (রাঃ)-কে জিজ্ঞাসা করা হইয়াছিল",
      ),
    ).toBe("সা'দ ইবন আবী ওয়াক্কাস (রা.)")
  })

  it('returns null instead of guessing', () => {
    expect(
      extractNarrator(
        'মুহাম্মদ ইবনু আল মুসান্না (রহঃ) ..... ইয়াহইয়া ইবনু সাঈদ (রহঃ) এর উল্লেখিত সূত্রে',
      ),
    ).toBeNull()
    expect(
      extractNarrator('নবী করীম সাল্লাল্লাহু আলাইহি ওয়াসাল্লাম এর পত্নী উম্মে সালমা (রাঃ) বলিতেন'),
    ).toBeNull()
  })

  it('cleans leading punctuation', () => {
    expect(cleanHadithText('। আনাস (রাঃ) বলেন')).toBe('আনাস (রাঃ) বলেন')
  })
})

describe('grades', () => {
  it('maps dataset labels', () => {
    expect(mapGrade('Sahih')).toBe('sahih')
    expect(mapGrade('Hasan Sahih')).toBe('sahih')
    expect(mapGrade('Isnaad Hasan')).toBe('hasan')
    expect(mapGrade('Daif Isnaad')).toBe('daif')
    expect(mapGrade('Maudu')).toBe('mawdu')
    expect(mapGrade('')).toBe('unknown')
  })

  it('treats Bukhari and Muslim as sahih and prefers al-Albani elsewhere', () => {
    expect(pickGrade('bukhari', []).grade).toBe('sahih')
    const g = pickGrade('abudawud', [
      { name: 'Zubair Ali Zai', grade: 'Daif' },
      { name: 'Al-Albani', grade: 'Hasan' },
    ])
    expect(g).toEqual({ grade: 'hasan', source: 'শাইখ আলবানী: হাসান' })
    expect(pickGrade('tirmidhi', undefined).grade).toBe('unknown')
  })
})

describe('narrator extraction edge cases', () => {
  it('drops pronouns and rejects chain fragments', () => {
    expect(extractNarrator('আমি ইবনু আব্বাস (রাঃ) কে বলতে শুনেছি')).toBe('ইবনু আব্বাস (রা.)')
    expect(
      extractNarrator('সাফওয়ান তার পিতা সূত্রে (ইবনু উমাইয়্যাহ) (রাঃ) থেকে বর্ণিত'),
    ).toBeNull()
  })
})

describe('dash-free hadith text', () => {
  it('turns an introducing dash into a colon', () => {
    expect(normalizeDashes('তিনি বলেছেন— রাসূলুল্লাহ্ বলেছেন')).toBe(
      'তিনি বলেছেন: রাসূলুল্লাহ্ বলেছেন',
    )
    expect(normalizeDashes('মনে আছে– “হে ঈমানদারগণ!”')).toBe('মনে আছে: “হে ঈমানদারগণ!”')
  })
  it('keeps numbering with a plain hyphen', () => {
    expect(normalizeDashes('১—(১/৮) আবূ খাইসামাহ')).toBe('১-(১/৮) আবূ খাইসামাহ')
  })
  it('drops a dash that opens a line and never leaves a dangling colon', () => {
    expect(normalizeDashes('প্রথম কথা\n— দ্বিতীয় কথা')).toBe('প্রথম কথা\nদ্বিতীয় কথা')
    expect(normalizeDashes('শেষ কথা—।')).toBe('শেষ কথা:।')
  })
  it('cleans imported text end to end and leaves Arabic words intact', () => {
    expect(cleanHadithText(' — সাক্ষ্য দেয়া— এবং সালাত')).not.toMatch(/[\u2013\u2014]/)
    expect(normalizeArabicDashes('قَالَ — حَدَّثَنَا')).toBe('قَالَ - حَدَّثَنَا')
  })
})
