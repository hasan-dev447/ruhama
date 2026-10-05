/** Select options shared by CMS collections and public forms. */
export const INTEREST_OPTIONS = [
  { label: 'লেখা', value: 'writing' },
  { label: 'দাওয়াহ', value: 'dawah' },
  { label: 'অনুবাদ', value: 'translation' },
  { label: 'টেক', value: 'tech' },
  { label: 'ইভেন্ট', value: 'events' },
] as const

export const CONTACT_TOPICS = [
  { label: 'সাধারণ', value: 'general' },
  { label: 'কনটেন্ট সংশোধন', value: 'correction' },
  { label: 'অংশীদারিত্ব', value: 'partnership' },
  { label: 'প্রযুক্তিগত সমস্যা', value: 'technical' },
  { label: 'বক্তা আমন্ত্রণ', value: 'invite' },
] as const

export type InterestValue = (typeof INTEREST_OPTIONS)[number]['value']
export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value']
