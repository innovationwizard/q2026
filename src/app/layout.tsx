import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiniela · Evento 2026',
  description: 'La quiniela del Evento 2026. Predice, compite y gana.',
  metadataBase: new URL('https://q2026.vercel.app'),
  openGraph: {
    title: 'Quiniela · Evento 2026',
    description: 'La quiniela del Evento 2026. Predice, compite y gana.',
    url: 'https://q2026.vercel.app',
    siteName: 'Quiniela 2026',
    locale: 'es_MX',
    type: 'website',
    images: [{
      url: 'https://q2026.vercel.app/opengraph-image',
      secureUrl: 'https://q2026.vercel.app/opengraph-image',
      width: 1200,
      height: 630,
      type: 'image/jpeg',
      alt: 'Quiniela 2026',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quiniela · Evento 2026',
    description: 'La quiniela del Evento 2026. Predice, compite y gana.',
    images: ['https://q2026.vercel.app/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-orion-bg text-ui-textMain antialiased">
        {children}
      </body>
    </html>
  )
}
