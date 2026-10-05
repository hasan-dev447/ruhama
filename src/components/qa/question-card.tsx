import { ArrowRight, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

import { PersonAvatar } from '@/components/content/cards'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { QuestionCardView } from '@/server/queries/types'

export function QuestionCard({ question }: { question: QuestionCardView }) {
  const href = `/qa/${question.slug}`
  return (
    <article
      className="card card-hover"
      style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        {question.category ? <Badge variant="cat">{question.category.name}</Badge> : null}
        <Badge variant="reviewed">
          <BadgeCheck className="ic" aria-hidden="true" />
          রিভিউকৃত উত্তর
        </Badge>
        {question.publishedAt ? (
          <span className="t-caption t-muted" style={{ marginLeft: 'auto' }}>
            {formatDate(question.publishedAt)}
          </span>
        ) : null}
      </div>
      <h2 className="t-h4" style={{ fontSize: 19 }}>
        <Link href={href} style={{ color: 'var(--rh-ink)', textDecoration: 'none' }}>
          {question.title}
        </Link>
      </h2>
      {question.excerpt ? <p className="t-small t-muted clamp-3">{question.excerpt}</p> : null}
      <div
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 }}
      >
        {question.answeredBy ? (
          <>
            <PersonAvatar person={question.answeredBy} size="sm" />
            <span className="t-small">{question.answeredBy.name}</span>
          </>
        ) : null}
        <Link
          href={href}
          className="link-arrow"
          style={{ marginLeft: 'auto' }}
          aria-label={`উত্তর পড়ুন: ${question.title}`}
        >
          উত্তর পড়ুন <ArrowRight className="ic" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
