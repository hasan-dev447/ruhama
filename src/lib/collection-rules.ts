import { ROLES, type Role } from './roles'

/**
 * The rules each admin menu (collection) runs by, adjustable from that menu's "নিয়ম" panel instead
 * of being fixed in code. Every rule is declared here once: what it means, its kind, its limits and
 * its default (the value the code used before it became adjustable). The server reads the saved
 * values through server/rules.ts and enforces them; nothing here trusts the browser.
 *
 * Adding a rule: add it below, then read it with getRules(slug) where it applies. No migration is
 * needed: all values live in one JSON field of the "collection-rules" global.
 */

type RuleBase = {
  key: string
  /** the full question shown in the panel */
  label: string
  /** two or three words for the closed panel's summary line */
  short: string
  help?: string
  /** set on the রোল ও অনুমতি page; shown here read-only */
  managedByRoles?: boolean
}

export type RuleDef =
  | (RuleBase & {
      type: 'number'
      default: number
      min: number
      max: number
      unit?: string
    })
  | (RuleBase & { type: 'boolean'; default: boolean })
  | (RuleBase & {
      type: 'roles'
      default: Role[]
      /** roles that must always stay in (so nobody locks the site out) */
      required?: Role[]
      /** the roles offered (staff roles when left out) */
      choices?: Role[]
    })

export type RuleValue = number | boolean | Role[]

const workflowRules = (noun: string): RuleDef[] => [
  {
    key: 'requiredApprovals',
    short: 'অনুমোদন',
    label: 'প্রকাশের আগে কতজন রিভিউয়ারের অনুমোদন লাগবে',
    help: `0 দিলে রিভিউ ছাড়াই প্রকাশ করা যাবে। প্রত্যেক অনুমোদন ভিন্ন রিভিউয়ারের হতে হবে।`,
    type: 'number',
    default: 2,
    min: 0,
    max: 10,
    unit: 'জন',
  },
  {
    key: 'allowSelfReview',
    short: 'নিজে অনুমোদন',
    label: `লেখক নিজের ${noun} নিজে অনুমোদন করতে পারবেন`,
    help: 'চালু করলে লেখকের নিজের অনুমোদনও গণনায় আসবে (যদি তিনি রিভিউয়ার হন)।',
    type: 'boolean',
    default: false,
  },
  {
    key: 'resetApprovalsOnEdit',
    short: 'বদলালে অনুমোদন বাতিল',
    label: 'লেখা বদলালে আগের অনুমোদন বাতিল হবে',
    help: 'চালু থাকলে অনুমোদনের পর কিছু বদলালে আবার রিভিউ লাগবে (নিরাপদ)।',
    type: 'boolean',
    default: true,
  },
  {
    key: 'reviewerRoles',
    short: 'রিভিউ',
    managedByRoles: true,
    label: 'কারা রিভিউ (অনুমোদন বা সংশোধনের অনুরোধ) করতে পারবেন',
    type: 'roles',
    default: ['super_admin', 'shura', 'reviewer'],
    required: ['super_admin'],
  },
  {
    key: 'publisherRoles',
    short: 'প্রকাশ',
    managedByRoles: true,
    label: 'কারা চূড়ান্ত প্রকাশ ও প্রকাশ বাতিল করতে পারবেন',
    type: 'roles',
    default: ['super_admin', 'shura'],
    required: ['super_admin'],
  },
]

export const COLLECTION_RULES: Record<string, { title: string; rules: RuleDef[] }> = {
  articles: { title: 'প্রবন্ধের নিয়ম', rules: workflowRules('প্রবন্ধ') },
  'ikhtilaf-topics': { title: 'মতপার্থক্যের বিষয়ের নিয়ম', rules: workflowRules('বিষয়') },
  questions: { title: 'প্রশ্নোত্তরের নিয়ম', rules: workflowRules('উত্তর') },
  events: {
    title: 'মজলিসের নিয়ম',
    rules: [
      {
        key: 'defaultCapacity',
        short: 'আসন',
        label: 'নতুন মজলিসে আসন সংখ্যা (শুরুর মান)',
        help: 'নতুন মজলিস তৈরির সময় এই সংখ্যা বসানো থাকবে; প্রতিটিতে আলাদা করে বদলানো যায়।',
        type: 'number',
        default: 100,
        min: 1,
        max: 100000,
        unit: 'টি',
      },
      {
        key: 'defaultMaxGuests',
        short: 'সঙ্গী',
        label: 'একজন সর্বোচ্চ কতজন সঙ্গী আনতে পারবেন',
        help: 'যে মজলিসে আলাদা করে সীমা দেওয়া নেই সেখানে এটি খাটবে। 0 মানে শুধু বাকি আসনের সীমা।',
        type: 'number',
        default: 0,
        min: 0,
        max: 5000,
        unit: 'জন',
      },
      {
        key: 'closeRegistrationHoursBefore',
        short: 'রেজিস্ট্রেশন বন্ধ',
        label: 'শুরুর কত ঘণ্টা আগে রেজিস্ট্রেশন বন্ধ হবে',
        help: '0 মানে মজলিস শেষ না হওয়া পর্যন্ত রেজিস্ট্রেশন খোলা।',
        type: 'number',
        default: 0,
        min: 0,
        max: 168,
        unit: 'ঘণ্টা',
      },
    ],
  },
  'event-recaps': {
    title: 'সারসংক্ষেপের নিয়ম',
    rules: [
      {
        key: 'notifyRegistrants',
        short: 'নোটিফিকেশন',
        label: 'প্রকাশ করলে রেজিস্টার করা সদস্যদের নোটিফিকেশন যাবে',
        type: 'boolean',
        default: true,
      },
    ],
  },
  people: {
    title: 'আলিম, লেখক ও বক্তার প্রোফাইলের নিয়ম',
    rules: [
      {
        key: 'profileRoles',
        short: 'প্রোফাইল পান',
        label: 'কোন রোল দিলে সদস্যের পাবলিক প্রোফাইল নিজে থেকে তৈরি হবে',
        help: 'ইউজার মেনুতে কাউকে এই রোল দিলে এই তালিকায় তাঁর প্রোফাইল তৈরি হয়ে তাঁর অ্যাকাউন্টের সাথে যুক্ত হয়; তিনি নিজের সেটিংস থেকে তা লিখতে পারেন। রোল তুলে নিলে প্রোফাইল সাইট থেকে লুকানো হয় (মুছে যায় না)।',
        type: 'roles',
        default: ['scholar', 'speaker', 'author', 'reviewer'],
        choices: ['scholar', 'speaker', 'author', 'reviewer'],
      },
      {
        key: 'requireApproval',
        short: 'অনুমোদন',
        label: 'সদস্যের নিজের করা পরিবর্তন সাইটে যাওয়ার আগে অনুমোদন লাগবে',
        help: 'চালু থাকলে পরিবর্তন “অনুমোদন বাকি” হিসেবে জমা থাকে; সুপার অ্যাডমিন, শূরা বা সম্পাদক প্রোফাইলের পাতা থেকে অনুমোদন বা বাতিল করেন। বন্ধ থাকলে সাথে সাথে প্রকাশ হয়।',
        type: 'boolean',
        default: true,
      },
    ],
  },
  users: {
    title: 'সদস্য অ্যাকাউন্টের নিয়ম',
    rules: [
      {
        key: 'profilePhotoMaxMB',
        short: 'ছবি',
        label: 'প্রোফাইল ছবির সর্বোচ্চ আকার',
        type: 'number',
        default: 3,
        min: 1,
        max: 10,
        unit: 'MB',
      },
      {
        key: 'maxExtraContacts',
        short: 'অতিরিক্ত যোগাযোগ',
        label: 'অতিরিক্ত কয়টি ইমেইল ও কয়টি মোবাইল রাখা যাবে (প্রতিটি ধরনে)',
        type: 'number',
        default: 5,
        min: 0,
        max: 20,
        unit: 'টি',
      },
      {
        key: 'contactCodeMinutes',
        short: 'কোডের মেয়াদ',
        label: 'যাচাইয়ের কোড কত মিনিট কার্যকর থাকবে',
        type: 'number',
        default: 10,
        min: 5,
        max: 60,
        unit: 'মিনিট',
      },
    ],
  },
}

export type RulesFor = Record<string, RuleValue>

/** One rule's value made safe: right type, inside its limits, required roles kept. */
export function cleanRule(def: RuleDef, raw: unknown): RuleValue {
  if (def.type === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw)
    if (!Number.isFinite(n)) return def.default
    return Math.min(def.max, Math.max(def.min, Math.round(n)))
  }
  if (def.type === 'boolean') return typeof raw === 'boolean' ? raw : def.default
  if (!Array.isArray(raw)) return def.default
  const picked = raw.filter((r): r is Role => (ROLES as readonly string[]).includes(r as string))
  const allowed = def.choices ?? ROLES
  return [...new Set([...(def.required ?? []), ...picked.filter((r) => allowed.includes(r))])]
}

/** A collection's rules: saved values where valid, defaults for the rest. */
export function resolveRules(slug: string, saved: unknown): RulesFor {
  const defs = COLLECTION_RULES[slug]?.rules ?? []
  const stored = (saved && typeof saved === 'object' ? saved : {}) as Record<string, unknown>
  return Object.fromEntries(
    defs.map((d) => [d.key, d.key in stored ? cleanRule(d, stored[d.key]) : d.default]),
  )
}

/** Every collection's rules cleaned, for saving (unknown collections and keys are dropped). */
export function cleanAllRules(raw: unknown): Record<string, RulesFor> {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Record<string, RulesFor> = {}
  for (const slug of Object.keys(COLLECTION_RULES)) {
    if (input[slug] !== undefined) out[slug] = resolveRules(slug, input[slug])
  }
  return out
}

/** Typed view of the editorial workflow rules (articles, ikhtilaf topics, questions). */
export type WorkflowRules = {
  requiredApprovals: number
  allowSelfReview: boolean
  resetApprovalsOnEdit: boolean
  reviewerRoles: Role[]
  publisherRoles: Role[]
}

export const DEFAULT_WORKFLOW_RULES = resolveRules('articles', {}) as unknown as WorkflowRules
