import { IconUsers } from '@/components/icons'

import { RichText } from '@/components/content/rich-text'
import { YouTubeFacade } from '@/components/content/youtube-facade'
import { bn } from '@/lib/format'
import { pickImageUrl } from '@/lib/rich-image'

import { RecapGallery, type RecapPhoto } from './recap-gallery'

type Media = {
  sizes?: { w480?: { url?: string | null; width?: number | null } | null } | null
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type EventRecapData = {
  summary: string
  attendance?: number | null
  content?: unknown
  gallery?: (Media | number)[] | null
  videos?:
    | {
        youtubeId?: string | null
        url?: string | null
        title?: string | null
        id?: string | null
      }[]
    | null
}

/** "What happened" on the page of a মজলিস that is over: summary, recordings, write-up and photos. */
export function EventRecap({ recap, title }: { recap: EventRecapData; title: string }) {
  const photos: RecapPhoto[] = (recap.gallery ?? [])
    .filter((m): m is Media => typeof m === 'object' && Boolean(m?.url))
    .map((m) => ({
      url: m.url!,
      thumb: pickImageUrl(m, 'small') ?? undefined,
      alt: m.alt ?? '',
      width: m.width,
      height: m.height,
    }))
  const videos = (recap.videos ?? []).filter((v) => v.youtubeId)

  return (
    <section id="recap" aria-labelledby="recap-title" style={{ scrollMarginTop: 96 }}>
      <span className="eyebrow">মজলিসের সারসংক্ষেপ</span>
      <h2 id="recap-title" className="t-h3" style={{ marginTop: 8 }}>
        কী হয়েছিল
      </h2>
      <p className="lead" style={{ marginTop: 12 }}>
        {recap.summary}
      </p>
      {recap.attendance ? (
        <p className="t-small t-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconUsers className="ic" aria-hidden="true" />
          প্রায় {bn(recap.attendance)} জন উপস্থিত ছিলেন
        </p>
      ) : null}

      {videos.length ? (
        <div className="recap-videos">
          {videos.map((v, i) => (
            <YouTubeFacade
              key={v.id ?? v.youtubeId!}
              videoId={v.youtubeId!}
              title={v.title || `${title}: ভিডিও ${bn(i + 1)}`}
              eyebrow={v.title ? null : 'রেকর্ডিং'}
            />
          ))}
        </div>
      ) : null}

      {recap.content ? (
        <RichText
          data={recap.content}
          className="prose-first"
          style={{ marginTop: 24, fontSize: 17 }}
        />
      ) : null}

      {photos.length ? (
        <div style={{ marginTop: 28 }}>
          <h3 className="t-h4">ছবি</h3>
          <RecapGallery photos={photos} title={title} />
        </div>
      ) : null}
    </section>
  )
}
