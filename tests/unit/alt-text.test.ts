import { describe, expect, it } from 'vitest'

import { altFromFilename } from '@/lib/alt-text'

describe('altFromFilename', () => {
  it('turns a descriptive file name into words', () => {
    expect(altFromFilename('majlis-dhaka_2026.jpg', 'image/jpeg')).toBe('Majlis dhaka')
    expect(altFromFilename('মজলিস-খুলনা.png', 'image/png')).toBe('মজলিস খুলনা')
    expect(altFromFilename('ustaz%20abdur%20rahman%20(1).webp', 'image/webp')).toBe(
      'Ustaz abdur rahman',
    )
  })

  it('drops camera, app and date names and falls back to the kind of file', () => {
    expect(altFromFilename('IMG_20261007_123456.jpg', 'image/jpeg')).toBe('Ruhama-র ছবি')
    expect(altFromFilename('DSC0042.JPG', 'image/jpeg')).toBe('Ruhama-র ছবি')
    expect(altFromFilename('WhatsApp Image 2026-10-07 at 10.12.33.jpeg', 'image/jpeg')).toBe(
      'Ruhama-র ছবি',
    )
    expect(altFromFilename('3f9a1c2be7d04a11.png', 'image/png')).toBe('Ruhama-র ছবি')
    expect(altFromFilename('Screenshot 2026-10-07 101233.png', 'image/png')).toBe('Ruhama-র ছবি')
    expect(altFromFilename('recording.mp3', 'audio/mpeg')).toBe('Recording')
    expect(altFromFilename('01.pdf', 'application/pdf')).toBe('Ruhama-র ডকুমেন্ট')
  })
})
