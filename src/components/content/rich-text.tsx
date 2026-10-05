import {
  RichText as LexicalRichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import { CircleAlert, Info, Lightbulb } from 'lucide-react'
import Image from 'next/image'
import type { ReactNode } from 'react'

import { imageSrcSet, imageUrl, transformable } from '@/lib/image-url'
import { headingId } from '@/lib/lexical'
import { ayahReference } from '@/lib/quran-meta'
import { cn } from '@/lib/utils'

import { AyahCard, DalilBox, HadithCard, type DalilItem } from './scripture'
import { YouTubeFacade, youtubeIdFrom } from './youtube-facade'

type Rel<T> = T | number | string | null | undefined
type AyahDoc = { arabic?: string; translation?: string; surah?: number; ayah?: number }
type HadithDoc = {
  arabic?: string | null
  text?: string
  narrator?: string | null
  grade?: string | null
  key?: string
  numberLabel?: string | null
  number?: number
  book?: Rel<{ name?: string }>
}

type MediaDoc = {
  url?: string | null
  alt?: string | null
  credit?: string | null
  filename?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
}

const asDoc = <T,>(v: Rel<T>): T | null => (v && typeof v === 'object' ? (v as T) : null)

type BlockNode = { fields: Record<string, unknown> }

/** Lexical heading/text nodes we need to inspect for anchors */
type Node = { type?: string; tag?: string; children?: Node[] }

export type HeadingIdFn = (index: number, text: string) => string

const nodeText = (n: Node & { text?: string }): string =>
  typeof n.text === 'string' ? n.text : (n.children ?? []).map((c) => nodeText(c)).join('')

const makeConverters =
  (idFor: HeadingIdFn): JSXConvertersFunction =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    heading: ({ node, nodesToJSX, parent }) => {
      const n = node as Node
      const children = nodesToJSX({ nodes: (n.children ?? []) as never })
      const Tag = (['h2', 'h3', 'h4'].includes(n.tag ?? '') ? n.tag : 'h2') as 'h2' | 'h3' | 'h4'
      let id: string | undefined
      if (Tag === 'h2' || Tag === 'h3') {
        const siblings = ((parent as Node | undefined)?.children ?? []) as Node[]
        const index =
          siblings
            .filter((s) => s.type === 'heading' && (s.tag === 'h2' || s.tag === 'h3'))
            .indexOf(n) + 1
        if (index > 0) id = idFor(index, nodeText(n).trim())
      }
      return <Tag id={id}>{children}</Tag>
    },
    // images an editor places in the text: responsive and resized at the edge (see lib/image-url)
    upload: ({ node }) => {
      const doc = asDoc<MediaDoc>((node as { value?: Rel<MediaDoc> }).value)
      if (!doc?.url) return null
      if (!doc.mimeType?.startsWith('image/')) {
        return (
          <a href={doc.url} className="link" target="_blank" rel="noopener">
            {doc.alt || doc.filename || 'সংযুক্ত ফাইল'}
          </a>
        )
      }
      return (
        <figure className="rt-figure">
          {doc.width && doc.height ? (
            <Image
              unoptimized={!transformable(doc.url)}
              src={doc.url}
              width={doc.width}
              height={doc.height}
              sizes="(max-width: 760px) 100vw, 720px"
              alt={doc.alt ?? ''}
            />
          ) : (
            // dimensions unknown (very old upload): plain image, still resized at the edge when enabled
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl(doc.url, { width: 1080 })}
              srcSet={imageSrcSet(doc.url)}
              sizes="(max-width: 760px) 100vw, 720px"
              alt={doc.alt ?? ''}
              loading="lazy"
              decoding="async"
            />
          )}
          {doc.credit ? <figcaption className="t-caption t-muted">{doc.credit}</figcaption> : null}
        </figure>
      )
    },
    blocks: {
      ayah: ({ node }: { node: BlockNode }) => {
        const f = node.fields as {
          ayah?: Rel<AyahDoc>
          arabic?: string
          translation?: string
          reference?: string
          compact?: boolean
        }
        const doc = asDoc(f.ayah)
        const translation = f.translation || doc?.translation || ''
        const reference =
          f.reference || (doc?.surah && doc.ayah ? ayahReference(doc.surah, doc.ayah) : '')
        return (
          <AyahCard
            arabic={f.arabic || doc?.arabic}
            translation={translation}
            reference={reference}
            compact={f.compact}
          />
        )
      },
      hadith: ({ node }: { node: BlockNode }) => {
        const f = node.fields as {
          hadith?: Rel<HadithDoc>
          arabic?: string
          text?: string
          narrator?: string
          source?: string
          grade?: string
          gradeNote?: string
        }
        const doc = asDoc(f.hadith)
        const bookName = asDoc(doc?.book)?.name
        const source =
          f.source ||
          (doc && bookName ? `${bookName} : ${doc.numberLabel ?? doc.number}` : undefined)
        return (
          <HadithCard
            arabic={f.arabic || doc?.arabic}
            text={f.text || doc?.text || ''}
            narrator={f.narrator || doc?.narrator}
            source={source}
            grade={f.grade || doc?.grade}
            gradeNote={f.gradeNote}
          />
        )
      },
      dalil: ({ node }: { node: BlockNode }) => {
        const f = node.fields as { id?: string; title?: string; items?: DalilItem[] }
        return (
          <DalilBox
            id={`dalil-${f.id ?? 'block'}`}
            title={f.title || undefined}
            items={f.items ?? []}
          />
        )
      },
      youtube: ({ node }: { node: BlockNode }) => {
        const f = node.fields as { url: string; title: string; start?: number }
        const id = youtubeIdFrom(f.url)
        if (!id) return null
        return (
          <div style={{ marginBlock: 32 }}>
            <YouTubeFacade videoId={id} title={f.title} start={f.start} />
          </div>
        )
      },
      callout: ({ node }: { node: BlockNode }) => {
        const f = node.fields as {
          tone?: 'note' | 'gold' | 'warning'
          title?: string
          body: string
        }
        const Icon = f.tone === 'warning' ? CircleAlert : f.tone === 'gold' ? Lightbulb : Info
        return (
          <aside
            className={cn(
              'callout',
              f.tone === 'gold' && 'callout--gold',
              f.tone === 'warning' && 'callout--warning',
            )}
          >
            <Icon className="ic" aria-hidden="true" />
            <div className="callout__body">
              {f.title ? <strong>{f.title}</strong> : null}
              <p>{f.body}</p>
            </div>
          </aside>
        )
      },
      pullQuote: ({ node }: { node: BlockNode }) => {
        const f = node.fields as { text: string }
        return <p className="pull">{f.text}</p>
      },
    },
  })

const defaultConverters = makeConverters((i) => headingId(i))

/** Renders Payload rich text inside the design's `.prose` reading column. */
export function RichText({
  data,
  className,
  style,
  plain,
  headingIdFor,
}: {
  data: unknown
  className?: string
  style?: React.CSSProperties
  plain?: boolean
  /** Custom anchors for h2/h3 (must match the ids used for the table of contents) */
  headingIdFor?: HeadingIdFn
}): ReactNode {
  if (!data || typeof data !== 'object' || !('root' in (data as object))) return null
  return (
    <div className={cn(!plain && 'prose', className)} style={style}>
      <LexicalRichText
        data={data as never}
        converters={headingIdFor ? makeConverters(headingIdFor) : defaultConverters}
        disableContainer
        disableIndent
        disableTextAlign
      />
    </div>
  )
}
