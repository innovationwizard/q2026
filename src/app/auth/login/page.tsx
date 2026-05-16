'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError('No se pudo enviar el enlace. Verifica tu correo e intenta de nuevo.')
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen bg-orion-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ev26-purple mb-4">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-ui-textMain">Quiniela</h1>
          <p className="text-ui-textMuted mt-1 text-sm">Evento 2026</p>
        </div>

        <div className="bg-orion-surface rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-ev26-purple/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-ev26-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ui-textMain mb-2">Revisa tu correo</h2>
              <p className="text-ui-textMuted text-sm leading-relaxed">
                Enviamos un enlace de acceso a <span className="text-ui-textMain font-medium">{email}</span>. Haz clic en el enlace para ingresar.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="mt-6 text-sm text-ui-textMuted hover:text-ui-textMain transition-colors"
              >
                Usar otro correo
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-ui-textMain mb-1">Ingresar</h2>
              <p className="text-ui-textMuted text-sm mb-6">
                Ingresa tu correo corporativo y te enviamos un enlace de acceso.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ui-textMuted mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="w-full bg-orion-bg border border-white/10 rounded-lg px-4 py-2.5 text-ui-textMain placeholder-ui-textMuted focus:outline-none focus:border-ev26-purple transition-colors text-sm"
                  />
                </div>

                {error && (
                  <p className="text-ui-cta text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de acceso'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
