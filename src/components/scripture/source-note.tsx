import { Info } from 'lucide-react'

/** Dataset attribution under scripture pages. */
export function SourceNote({
  items,
}: {
  items: { label: string; url: string; license: string }[]
}) {
  return (
    <aside className="privacy-note" style={{ marginTop: 40 }} aria-label="তথ্যসূত্র">
      <Info className="ic" aria-hidden="true" />
      <span>
        {items.map((s, i) => (
          <span key={s.url}>
            {i ? ' · ' : ''}
            <a href={s.url} className="link" target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>{' '}
            ({s.license})
          </span>
        ))}
      </span>
    </aside>
  )
}
