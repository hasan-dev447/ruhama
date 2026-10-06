import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { REVIEW_STATUS_LABELS } from '@/payload/workflow/constants'
import { reviewQueue } from '@/server/services/review'

const LABEL = {
  articles: 'আর্টিকেল',
  'ikhtilaf-topics': 'ইখতিলাফ',
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
    <section className="rh-queue" aria-labelledby="rh-queue-h">
      <div className="rh-queue__head">
        <h2 id="rh-queue-h" className="rh-dash__h2">
          আপনার কাজ বাকি
        </h2>
        <p>যেসব কনটেন্টে review, সংশোধন বা publish বাকি আছে।</p>
      </div>
      {items.length === 0 ? (
        <p className="rh-queue__empty">এখন কোনো কাজ বাকি নেই। আলহামদুলিল্লাহ।</p>
      ) : (
        <ul className="rh-queue__list">
          {items.map((i) => (
            <li key={`${i.collection}-${i.id}`}>
              <a href={`/admin/collections/${i.collection}/${i.id}`} className="rh-queue__item">
                <span className="rh-queue__title">{i.title || 'শিরোনামহীন'}</span>
                <span className="rh-queue__meta">{LABEL[i.collection]}</span>
                <span className={`rh-badge rh-badge--${i.reviewStatus}`}>
                  {REVIEW_STATUS_LABELS[i.reviewStatus]}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
