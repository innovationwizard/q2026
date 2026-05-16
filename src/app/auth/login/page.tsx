'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/logo'

type Mode = 'magic' | 'password'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]         = useState<Mode>('magic')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setLoading(false)
    if (error) {
      setError('No se pudo enviar el enlace. Verifica tu correo e intenta de nuevo.')
      return
    }
    setSent(true)
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Correo o contraseña incorrectos.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-orion-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ev26-purple mb-4">
            <Logo size={30} />
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
                Enviamos un enlace de acceso a{' '}
                <span className="text-ui-textMain font-medium">{email}</span>.
                Haz clic en el enlace para ingresar.
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
              <h2 className="text-lg font-semibold text-ui-textMain mb-4">Ingresar</h2>

              <div className="flex rounded-lg bg-orion-bg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => switchMode('magic')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                    mode === 'magic'
                      ? 'bg-ev26-purple text-white'
                      : 'text-ui-textMuted hover:text-ui-textMain'
                  }`}
                >
                  Enlace mágico
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('password')}
                  className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${
                    mode === 'password'
                      ? 'bg-ev26-purple text-white'
                      : 'text-ui-textMuted hover:text-ui-textMain'
                  }`}
                >
                  Contraseña
                </button>
              </div>

              <form
                onSubmit={mode === 'magic' ? handleMagicLink : handlePassword}
                className="space-y-4"
              >
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

                {mode === 'password' && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-ui-textMuted mb-1.5">
                      Contraseña
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-orion-bg border border-white/10 rounded-lg px-4 py-2.5 text-ui-textMain placeholder-ui-textMuted focus:outline-none focus:border-ev26-purple transition-colors text-sm"
                    />
                  </div>
                )}

                {error && <p className="text-ui-cta text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !email || (mode === 'password' && !password)}
                  className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loading
                    ? 'Cargando...'
                    : mode === 'magic'
                    ? 'Enviar enlace de acceso'
                    : 'Ingresar'}
                </button>

                {mode === 'password' && (
                  <p className="text-center">
                    <Link
                      href="/auth/reset-password"
                      className="text-sm text-ui-textMuted hover:text-ui-textMain transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
