import { describe, expect, it } from 'vitest'

import { flagReasons, type AuthorStanding, type ModerationRules } from '@/lib/moderation'

const rules: ModerationRules = {
  firstPostsModerated: 3,
  maxLinks: 2,
  blockedTerms: ['কাফির', 'spam-word'],
}
const regular: AuthorStanding = { approvedPosts: 10, trusted: false, staff: false }

describe('forum auto-flag rules', () => {
  it('lets a normal post from an established member through', () => {
    expect(
      flagReasons('আসসালামু আলাইকুম, রাগ নিয়ন্ত্রণে আমার অভিজ্ঞতা লিখছি।', rules, regular),
    ).toEqual([])
  })

  it('holds the first posts of new members', () => {
    expect(
      flagReasons('প্রথম পোস্ট', rules, { approvedPosts: 1, trusted: false, staff: false }),
    ).toContain('new_member')
    expect(
      flagReasons('প্রথম পোস্ট', rules, { approvedPosts: 1, trusted: true, staff: false }),
    ).not.toContain('new_member')
  })

  it('flags blocked terms regardless of case', () => {
    expect(flagReasons('এটা SPAM-WORD আছে', rules, regular)).toContain('blocked_term')
    expect(flagReasons('তারা কাফির', rules, regular)).toContain('blocked_term')
  })

  it('flags too many links, shouting and repetition', () => {
    expect(
      flagReasons('https://a.example https://b.example www.c.example', rules, regular),
    ).toContain('too_many_links')
    expect(flagReasons('THIS IS ABSOLUTELY UNACCEPTABLE BEHAVIOUR', rules, regular)).toContain(
      'shouting',
    )
    expect(flagReasons('না না না না না না না', rules, regular)).toContain('repetition')
    expect(flagReasons('!!!!!!!!!!!!', rules, regular)).toContain('repetition')
  })

  it('never flags staff', () => {
    expect(
      flagReasons('https://a https://b https://c', rules, {
        approvedPosts: 0,
        trusted: false,
        staff: true,
      }),
    ).toEqual([])
  })
})
