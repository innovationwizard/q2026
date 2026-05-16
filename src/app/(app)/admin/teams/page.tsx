'use client'

import { useState, useEffect, useCallback } from 'react'
import { Team } from '@/types/database'

export default function AdminTeamsPage() {
  const [teams,   setTeams]   = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState<'list' | 'create'>('list')
  const [form, setForm] = useState({ name: '', code: '', groupLetter: '', ranking: '', flagUrl: '' })
  const [creating, setCreating] = useState(false)
  const [msg,      setMsg]     = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/teams')
      .then((r) => r.json())
      .then(({ teams }) => setTeams(teams ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setMsg(null)
    const body: Record<string, unknown> = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    }
    if (form.groupLetter) body.groupLetter = form.groupLetter.toUpperCase()
    if (form.ranking)     body.ranking     = parseInt(form.ranking)
    if (form.flagUrl)     body.flagUrl     = form.flagUrl

    const res = await fetch('/api/admin/teams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setMsg('Equipo creado')
      setForm({ name: '', code: '', groupLetter: '', ranking: '', flagUrl: '' })
      load()
      setTab('list')
    } else {
      setMsg(data.error ?? 'Error al crear equipo')
    }
  }

  const inputCls = "w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ui-textMain">Equipos</h1>
        <div className="flex gap-1.5">
          {(['list', 'create'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tab === t ? 'bg-ev26-purple/15 border-ev26-purple/40 text-ui-textMain' : 'border-white/10 text-ui-textMuted hover:text-ui-textMain'
              }`}>
              {t === 'list' ? `Lista (${teams.length})` : '+ Crear'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'create' && (
        <div className="bg-orion-surface rounded-xl p-5 border border-white/5 max-w-md">
          <h2 className="font-semibold text-ui-textMain mb-4">Nuevo equipo</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Nombre *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className={inputCls} placeholder="México" />
              </div>
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Código (3 letras) *</label>
                <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.slice(0, 3) }))} required maxLength={3} className={inputCls} placeholder="MEX" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Grupo (letra)</label>
                <input type="text" value={form.groupLetter} onChange={(e) => setForm((f) => ({ ...f, groupLetter: e.target.value.slice(0, 1) }))} maxLength={1} className={inputCls} placeholder="A" />
              </div>
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Ranking</label>
                <input type="number" value={form.ranking} onChange={(e) => setForm((f) => ({ ...f, ranking: e.target.value }))} min={1} className={inputCls} placeholder="12" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ui-textMuted mb-1">URL de bandera (opcional)</label>
              <input type="url" value={form.flagUrl} onChange={(e) => setForm((f) => ({ ...f, flagUrl: e.target.value }))} className={inputCls} placeholder="https://…" />
            </div>
            {msg && <p className={`text-xs ${msg.includes('Error') || msg.includes('error') ? 'text-ui-cta' : 'text-ev26-cyan'}`}>{msg}</p>}
            <button type="submit" disabled={creating} className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {creating ? 'Creando…' : 'Crear equipo'}
            </button>
          </form>
        </div>
      )}

      {tab === 'list' && (
        loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="bg-orion-surface rounded-lg h-12 border border-white/5 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {teams.map((t) => (
              <div key={t.id} className="bg-orion-surface rounded-lg px-3 py-2.5 border border-white/5 flex items-center gap-2">
                <span className="text-xs font-bold text-ui-textMuted w-8 flex-shrink-0">{t.code}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ui-textMain truncate">{t.name}</p>
                  {t.group_letter && <p className="text-[10px] text-ui-textMuted">Grupo {t.group_letter}</p>}
                </div>
              </div>
            ))}
            {!teams.length && (
              <div className="col-span-full bg-orion-surface rounded-xl p-8 text-center border border-white/5">
                <p className="text-ui-textMuted text-sm">No hay equipos. Crea el primero.</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
