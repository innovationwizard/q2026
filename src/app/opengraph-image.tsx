import { ImageResponse } from 'next/og'

export const alt         = 'Quiniela 2026'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: '#060B14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 36,
      }}
    >
      <div
        style={{
          width: 140,
          height: 140,
          background: '#6A0DAD',
          borderRadius: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="88"
          height="88"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFD700"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" />
          <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" />
          <path d="M18 9h1.5a1 1 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
          <path d="M6 9H4.5a1 1 0 0 1 0-5H6" />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#F9FAFB', letterSpacing: '-1px' }}>
          Quiniela
        </span>
        <span style={{ fontSize: 32, color: '#8B949E', letterSpacing: '4px', textTransform: 'uppercase' }}>
          Evento 2026
        </span>
      </div>
    </div>,
    { ...size },
  )
}
