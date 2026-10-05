const MARK =
  'M24 5Q32.78 20.36 37.43 37.43Q20.36 32.78 5 24Q20.36 15.22 37.43 10.57Q32.78 27.64 24 43Q15.22 27.64 10.57 10.57Q27.64 15.22 43 24Q27.64 32.78 10.57 37.43Q15.22 20.36 24 5Z'

export function AdminIcon() {
  return (
    <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true" style={{ color: '#B88A3E' }}>
      <path
        d={MARK}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <AdminIcon />
      <span
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: '0.03em',
          color: 'var(--theme-text)',
        }}
      >
        Ruhama
      </span>
    </div>
  )
}
