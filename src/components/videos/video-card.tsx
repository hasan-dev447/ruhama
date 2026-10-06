import { IconPlay } from '@/components/icons'
import Link from 'next/link'

import { PersonAvatar } from '@/components/content/cards'
import { BrandMark } from '@/components/icons/brand-mark'
import { Badge, levelLabel } from '@/components/ui/badge'
import { bn, bnCompact, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PlaylistView, VideoCardView } from '@/server/queries/types'

const TINT = {
  teal: '',
  deep: 'vthumb--deep',
  umber: 'vthumb--umber',
  slate: 'vthumb--slate',
} as const

export function VideoThumb({
  tint,
  title,
  duration,
  play = true,
  style,
  titleStyle,
}: {
  tint: keyof typeof TINT
  title: string
  duration?: string
  play?: boolean
  style?: React.CSSProperties
  titleStyle?: React.CSSProperties
}) {
  return (
    <div className={cn('vthumb', TINT[tint])} style={style}>
      <div className="rh-pattern" aria-hidden="true" />
      <BrandMark className="vthumb__mark" />
      <span className="vthumb__title" style={titleStyle}>
        {title}
      </span>
      {play ? (
        <span className="vthumb__play" aria-hidden="true">
          <IconPlay className="ic" style={{ marginLeft: 3 }} />
        </span>
      ) : null}
      {duration ? <span className="vthumb__dur">{duration}</span> : null}
    </div>
  )
}

export function VideoCard({ video }: { video: VideoCardView }) {
  return (
    <Link href={`/videos/${video.slug}`} className="card card-hover vcard">
      <VideoThumb
        tint={video.tint}
        title={video.shortTitle || video.title}
        duration={formatDuration(video.durationSeconds)}
      />
      <div className="vcard__body">
        {video.category ? (
          <Badge variant="cat" style={{ alignSelf: 'flex-start' }}>
            {video.category.name}
          </Badge>
        ) : null}
        <h3 className="vcard__title">{video.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
          {video.speaker ? (
            <>
              <PersonAvatar person={video.speaker} size="sm" />
              <span className="t-small">{video.speaker.name}</span>
            </>
          ) : null}
          {video.viewCount ? (
            <span className="t-caption t-muted" style={{ marginLeft: 'auto' }}>
              {bnCompact(video.viewCount)} বার দেখা
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

export function PlaylistCard({ playlist }: { playlist: PlaylistView }) {
  const href = playlist.firstVideoSlug ? `/videos/${playlist.firstVideoSlug}` : '/videos'
  return (
    <Link href={href} className="card card-hover vcard" role="listitem">
      <VideoThumb
        tint={playlist.tint}
        title={playlist.title}
        duration={`${bn(playlist.videoCount)}টি ভিডিও`}
        play={false}
      />
      <div className="vcard__body">
        <span className="t-small t-muted">
          {[playlist.speakerLabel, playlist.level ? levelLabel(playlist.level) : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
    </Link>
  )
}
