import { describe, expect, it } from 'vitest'

import { canHavePhoto, genderLabel, isGender } from '@/lib/gender'
import { canViewProfile, readPrivacy } from '@/lib/profile-privacy'

const OWNER = 10
const viewer = (id: number, staff = false) => ({ id, staff })

describe('readPrivacy', () => {
  it('defaults to a public profile with every part shown', () => {
    const p = readPrivacy(undefined)
    expect(p.visibility).toBe('public')
    expect(p.allowedViewers).toEqual([])
    expect([
      p.showPhoto,
      p.showCover,
      p.showBio,
      p.showDistrict,
      p.showJourney,
      p.showActivity,
    ]).toEqual([true, true, true, true, true, true])
  })

  it('keeps older "profile off" rows locked', () => {
    expect(readPrivacy({ profilePublic: false }).visibility).toBe('private')
  })

  it('reads populated or plain viewer ids and drops junk', () => {
    const p = readPrivacy({ visibility: 'custom', allowedViewers: [3, { id: 7 }, 'x', null] })
    expect(p.allowedViewers).toEqual([3, 7])
  })
})

describe('canViewProfile', () => {
  it('lets the owner and moderators see any profile', () => {
    const p = readPrivacy({ visibility: 'private' })
    expect(canViewProfile(p, viewer(OWNER), OWNER)).toBe(true)
    expect(canViewProfile(p, viewer(99, true), OWNER)).toBe(true)
    expect(canViewProfile(p, viewer(99), OWNER)).toBe(false)
    expect(canViewProfile(p, null, OWNER)).toBe(false)
  })

  it('public is open to everyone, members only to signed-in people', () => {
    expect(canViewProfile(readPrivacy({ visibility: 'public' }), null, OWNER)).toBe(true)
    const members = readPrivacy({ visibility: 'members' })
    expect(canViewProfile(members, null, OWNER)).toBe(false)
    expect(canViewProfile(members, viewer(5), OWNER)).toBe(true)
  })

  it('custom is open only to the chosen people', () => {
    const p = readPrivacy({ visibility: 'custom', allowedViewers: [5] })
    expect(canViewProfile(p, viewer(5), OWNER)).toBe(true)
    expect(canViewProfile(p, viewer(6), OWNER)).toBe(false)
    expect(canViewProfile(p, null, OWNER)).toBe(false)
  })
})

describe('gender', () => {
  it('labels brothers and sisters, and only brothers have photos', () => {
    expect(genderLabel('male')).toBe('ভাই')
    expect(genderLabel('female')).toBe('বোন')
    expect(genderLabel(null)).toBeNull()
    expect(canHavePhoto('male')).toBe(true)
    expect(canHavePhoto('female')).toBe(false)
    expect(isGender('other')).toBe(false)
  })
})
