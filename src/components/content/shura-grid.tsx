import Link from 'next/link'

import { PersonAvatar, personHref } from '@/components/content/cards'

export type ShuraMember = {
  id: number
  name: string
  slug?: string | null
  avatarTone?: string | null
  shuraRole?: string | null
  kinds?: string[] | null
}

/** শূরা members as cards (no photos, by design); each opens the member's profile. */
export function ShuraGrid({ members }: { members: ShuraMember[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(220px, 100%), 1fr))',
        gap: 14,
        marginTop: 28,
      }}
    >
      {members.map((m) => (
        <Link
          key={m.id}
          href={personHref({ slug: m.slug ?? '', kinds: (m.kinds ?? []) as string[] })}
          className="card card-hover"
          style={{
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            textDecoration: 'none',
            color: 'var(--rh-ink)',
          }}
        >
          <PersonAvatar
            person={{ name: m.name, tone: m.avatarTone === 'gold' ? 'gold' : 'teal' }}
            size="lg"
          />
          <div>
            <strong style={{ display: 'block', lineHeight: 1.5 }}>{m.name}</strong>
            <span className="t-small t-muted">{m.shuraRole}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** The members chosen for the about page, in the chosen order; everyone when none are chosen. */
export function featuredShura(all: ShuraMember[], chosen: unknown): ShuraMember[] {
  const ids = (Array.isArray(chosen) ? chosen : [])
    .map((c) => (c && typeof c === 'object' ? (c as { id: number }).id : (c as number)))
    .filter(Boolean)
  if (!ids.length) return all
  const byId = new Map(all.map((m) => [m.id, m]))
  // a chosen person who is no longer active or in the শূরা drops out on their own
  return ids.map((id) => byId.get(id)).filter((m): m is ShuraMember => Boolean(m))
}
