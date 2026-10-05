import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { REVIEW_STATUS_LABELS } from '@/payload/workflow/constants'
import { reviewQueue } from '@/server/services/review'

const LABEL = {
  articles: 'প্রবন্ধ',
  'ikhtilaf-topics': 'মতপার্থক্য',
  questions: 'প্রশ্নোত্তর',
} as const

/** Dashboard widget: what is waiting on the signed-in staff member. */
export async function ReviewQueue({ payload, user }: { payload: Payload; user?: User | null }) {
  if (!user) return null
  let items: Awaited<ReturnType<typeof reviewQueue>> = []
  try {
    items = await reviewQueue({ payload, user })
  } catch {
    return null
  }
  return (
    <section
      style={{
        marginBottom: 32,
        padding: 20,
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 12,
      }}
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>আপনার অপেক্ষায়</h2>
      <p style={{ margin: '0 0 14px', fontSize: 13, opacity: 0.8 }}>
        রিভিউ, পরিবর্তন বা প্রকাশের অপেক্ষায় থাকা কনটেন্ট।
      </p>
      {items.length === 0 ? (
        <p style={{ fontSize: 14 }}>এখন কোনো কাজ বাকি নেই। আলহামদুলিল্লাহ।</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {items.map((i) => (
            <li
              key={`${i.collection}-${i.id}`}
              style={{
                padding: '10px 0',
                borderTop: '1px solid var(--theme-elevation-100)',
                display: 'flex',
                gap: 12,
                justifyContent: 'space-between',
              }}
            >
              <a href={`/admin/collections/${i.collection}/${i.id}`} style={{ fontWeight: 600 }}>
                {i.title || 'শিরোনামহীন'}
              </a>
              <span style={{ fontSize: 13, opacity: 0.85, whiteSpace: 'nowrap' }}>
                {LABEL[i.collection]} · {REVIEW_STATUS_LABELS[i.reviewStatus]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
