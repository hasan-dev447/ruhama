import { JOURNEY_STAGES } from '@/lib/journey'

const W = 760
const STEP = W / JOURNEY_STAGES.length
const cx = (i: number) => STEP * i + STEP / 2

/** Horizontal version of the journey thread: done, current and upcoming stages (design `Dashboard`). */
export function JourneyProgress({ current }: { current: number }) {
  const wave = JOURNEY_STAGES.map(
    (_, i) =>
      `${i === 0 ? 'M' : 'S'}${i === 0 ? 0 : cx(i) - STEP / 2} ${i % 2 ? 40 : 20} ${cx(i)} 30`,
  ).join(' ')
  const doneTo = cx(current)
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <div style={{ minWidth: W }}>
        <svg
          viewBox={`0 0 ${W} 60`}
          aria-hidden="true"
          style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
        >
          <defs>
            <clipPath id="journey-done">
              <rect x="0" y="0" width={doneTo} height="60" />
            </clipPath>
          </defs>
          <path
            d={`${wave} L${W} 30`}
            fill="none"
            stroke="var(--rh-border-strong)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <path
            d={`${wave} L${W} 30`}
            fill="none"
            stroke="var(--rh-accent)"
            strokeWidth="2"
            clipPath="url(#journey-done)"
          />
          {JOURNEY_STAGES.map((s, i) => (
            <circle
              key={s.value}
              cx={cx(i)}
              cy="30"
              r={i === current ? 9 : 6}
              fill={
                i < current
                  ? 'var(--rh-accent)'
                  : i === current
                    ? 'var(--rh-surface)'
                    : 'var(--rh-bg)'
              }
              stroke={i <= current ? 'var(--rh-accent)' : 'var(--rh-border-strong)'}
              strokeWidth={i === current ? 3 : 1.5}
            />
          ))}
        </svg>
        <ol
          className="list-reset"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${JOURNEY_STAGES.length}, minmax(0, 1fr))`,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {JOURNEY_STAGES.map((s, i) => (
            <li key={s.value} aria-current={i === current ? 'step' : undefined}>
              <strong
                style={{
                  display: 'block',
                  fontFamily: 'var(--rh-font-heading)',
                  fontSize: 16,
                  color:
                    i === current
                      ? 'var(--rh-accent-ink)'
                      : i > current
                        ? 'var(--rh-muted)'
                        : undefined,
                }}
              >
                {s.label}
              </strong>
              <span
                className={i === current ? 't-caption' : 't-caption t-muted'}
                style={
                  i === current ? { color: 'var(--rh-accent-ink)', fontWeight: 600 } : undefined
                }
              >
                {i < current ? 'সম্পন্ন' : i === current ? 'চলছে' : 'সামনে'}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
