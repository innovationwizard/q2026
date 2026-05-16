'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-orion-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ev26-purple mb-4">
            <span className="text-2xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-ui-textMain">Quiniela</h1>
          <p className="text-ui-textMuted mt-1 text-sm">Evento 2026</p>
        </div>

        <div className="bg-orion-surface rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-ui-textMain mb-1">Nueva contraseña</h2>
          <p className="text-ui-textMuted text-sm mb-6">
            Elige una contraseña segura de al menos 8 caracteres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-ui-textMuted mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-orion-bg border border-white/10 rounded-lg px-4 py-2.5 text-ui-textMain placeholder-ui-textMuted focus:outline-none focus:border-ev26-purple transition-colors text-sm"
              />
            </div>

            {error && <p className="text-ui-cta text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
