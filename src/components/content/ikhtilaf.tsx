import { IconChevronNext, IconColumns, IconHeart } from '@/components/icons'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { IconTile } from '@/components/ui/primitives'
import { bn } from '@/lib/format'
import type { IkhtilafCardView } from '@/server/queries/types'

import { DalilTag } from './scripture'

export const OPINION_ORDINALS = ['প্রথম মত', 'দ্বিতীয় মত', 'তৃতীয় মত', 'চতুর্থ মত', 'পঞ্চম মত']

export const stripHolderPrefix = (holders: string) =>
  holders.replace(/^যাঁরা এই মত পোষণ করেন:\s*/, '')

export const ikhtilafMeta = (t: Pick<IkhtilafCardView, 'opinionCount' | 'category' | 'subTopic'>) =>
  [`${bn(t.opinionCount)}টি মত`, t.category?.name, t.subTopic].filter(Boolean).join(' · ')

/** Two opinions side by side with their citations (home page and the Ikhtilaf index). */
export function IkhtilafPreviewCard({
  topic,
  className,
  raised = true,
}: {
  topic: IkhtilafCardView
  className?: string
  raised?: boolean
}) {
  return (
    <article
      className={`card ${raised ? 'card-raised' : 'card-hover'} card-pad ${className ?? ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Badge variant="cat">
          {[topic.category?.name, topic.subTopic].filter(Boolean).join(' · ')}
        </Badge>
        <span className="t-caption t-muted">{bn(topic.opinionCount)}টি মত · সমান গুরুত্বে</span>
      </div>
      <h3 className="t-h4">
        <Link href={`/ikhtilaf/${topic.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
          {topic.title}
        </Link>
      </h3>
      <div className="ikh-cols">
        {topic.opinions.slice(0, 2).map((o, i) => (
          <div key={o.title} className="ikh-col">
            <span className="ikh-col__label">
              <span>{bn(i + 1)}</span>
              {OPINION_ORDINALS[i]}
            </span>
            <p style={{ fontWeight: 600, lineHeight: 1.6 }}>{o.title}</p>
            <p className="t-small t-muted clamp-3">{stripHolderPrefix(o.holders)}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
              {o.citations.slice(0, 2).map((c) => (
                <DalilTag key={c}>{c}</DalilTag>
              ))}
            </div>
          </div>
        ))}
      </div>
      {topic.conduct ? (
        <div className="adab-strip">
          <IconHeart
            className="ic"
            aria-hidden="true"
            style={{ color: 'var(--rh-accent-ink)', marginTop: 3 }}
          />
          <p className="t-small">
            <strong>আমাদের আচরণ:</strong> {topic.conduct}
          </p>
        </div>
      ) : null}
    </article>
  )
}

/** Compact `.row-link` entry used under "আরও মতপার্থক্যের বিষয়". */
export function IkhtilafRow({
  topic,
}: {
  topic: Pick<IkhtilafCardView, 'slug' | 'title' | 'opinionCount' | 'category' | 'subTopic'>
}) {
  return (
    <li>
      <Link href={`/ikhtilaf/${topic.slug}`} className="row-link">
        <IconTile teal size={40}>
          <IconColumns className="ic" aria-hidden="true" />
        </IconTile>
        <span style={{ flex: 1 }}>
          <span className="row-link__title" style={{ display: 'block' }}>
            {topic.title}
          </span>
          <span className="t-small t-muted">{ikhtilafMeta(topic)}</span>
        </span>
        <IconChevronNext className="ic" aria-hidden="true" style={{ color: 'var(--rh-muted)' }} />
      </Link>
    </li>
  )
}
