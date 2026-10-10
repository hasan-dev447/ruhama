'use client'

import { useConfig } from '@payloadcms/ui'
import type { DefaultCellComponentProps } from 'payload'

import { initials } from '@/lib/format'

/**
 * A list cell with a round avatar before the title: the photo when there is one, otherwise the
 * initials. Reusable on any collection: point a field's admin.components.Cell here and, if needed,
 * pass clientProps `{ imageField }` (default `image`).
 */
export function AvatarCell({
  cellData,
  rowData,
  link,
  linkURL,
  collectionSlug,
  imageField = 'image',
}: DefaultCellComponentProps & { imageField?: string }) {
  const {
    config: {
      routes: { admin },
    },
  } = useConfig()
  const name = String(cellData ?? '')
  const image = typeof rowData?.[imageField] === 'string' ? (rowData[imageField] as string) : null
  const avatar = (
    <span className="rh-avatar-cell__img" aria-hidden="true">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" loading="lazy" />
      ) : (
        initials(name)
      )}
    </span>
  )
  const content = (
    <>
      {avatar}
      <span className="rh-avatar-cell__name">{name || 'নাম নেই'}</span>
    </>
  )
  if (!link) return <span className="rh-avatar-cell">{content}</span>
  const href = linkURL ?? `${admin}/collections/${collectionSlug}/${rowData?.id}`
  return (
    <a className="rh-avatar-cell" href={href}>
      {content}
    </a>
  )
}
