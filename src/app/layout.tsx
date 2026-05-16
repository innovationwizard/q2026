import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiniela · Evento 2026',
  description: 'Quiniela · Evento 2026',
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
