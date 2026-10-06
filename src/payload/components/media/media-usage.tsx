'use client'

import { useDocumentInfo } from '@payloadcms/ui'
import { Link2 } from 'lucide-react'
import { useEffect, useState } from 'react'

type Use = {
  slug: string
  kind: 'collection' | 'global'
  label: string
  docId?: number | string
  draftOnly: boolean
}

/** "Where is this file used?" in the media sidebar, drafts included. */
export function MediaUsage() {
  const { id } = useDocumentInfo()
  const [uses, setUses] = useState<Use[] | null>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    fetch(`/api/media/${id}/usage`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { uses: [] }))
      .then((json: { uses: Use[] }) => alive && setUses(json.uses))
      .catch(() => alive && setUses([]))
    return () => {
      alive = false
    }
  }, [id])

  if (!id) return null

  return (
    <div className="rh-usage">
      <span className="field-label">
        <Link2 size={14} aria-hidden="true" /> কোথায় ব্যবহৃত
      </span>
      {uses === null ? (
        <p className="rh-usage__muted">খোঁজা হচ্ছে</p>
      ) : uses.length === 0 ? (
        <p className="rh-usage__muted">
          কোথাও ব্যবহৃত হচ্ছে না। মুছলে R2 থেকেও স্থায়ীভাবে মুছে যাবে।
        </p>
      ) : (
        <>
          <ul>
            {uses.map((u) => (
              <li key={`${u.slug}-${u.docId ?? ''}`}>
                <a
                  href={
                    u.kind === 'global'
                      ? `/admin/globals/${u.slug}`
                      : `/admin/collections/${u.slug}/${u.docId}`
                  }
                >
                  {u.label}
                  {u.kind === 'collection' ? ` #${u.docId}` : ''}
                </a>
                {u.draftOnly ? <span className="rh-usage__draft">ড্রাফট</span> : null}
              </li>
            ))}
          </ul>
          <p className="rh-usage__muted">ব্যবহৃত অবস্থায় ফাইলটি মোছা যাবে না।</p>
        </>
      )}
    </div>
  )
}
