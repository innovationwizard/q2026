'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Phase, Team, Match } from '@/types/database'

interface MatchRow extends Match {
  phase:     Phase
  home_team: Team | null
  away_team: Team | null
}

type ScoreForm = { homeScore: string; awayScore: string; homePen: string; awayPen: string }

export default function AdminMatchesPage() {
  const [matches,  setMatches]  = useState<MatchRow[]>([])
  const [phases,   setPhases]   = useState<Phase[]>([])
  const [teams,    setTeams]    = useState<Team[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'list' | 'create'>('list')
  const [scoring,  setScoring]  = useState<string | null>(null)
  const [scoreForm, setScoreForm] = useState<ScoreForm>({ homeScore: '', awayScore: '', homePen: '', awayPen: '' })

  // Create match form
  const [form, setForm] = useState({
    phaseId: '', homeTeamId: '', awayTeamId: '', kickoffAt: '',
    homeTeamPlaceholder: '', awayTeamPlaceholder: '',
  })
  const [creating,  setCreating]  = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ matches }, { phases }, { teams }] = await Promise.all([
      fetch('/api/matches').then((r) => r.json()),
      fetch('/api/phases').then((r) => r.json()),
      fetch('/api/admin/teams').then((r) => r.json()),
    ])
    setMatches(matches ?? [])
    setPhases(phases ?? [])
    setTeams(teams ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateMsg(null)
    const body: Record<string, string> = { phaseId: form.phaseId, kickoffAt: new Date(form.kickoffAt).toISOString() }
    if (form.homeTeamId) body.homeTeamId = form.homeTeamId
    else if (form.homeTeamPlaceholder) body.homeTeamPlaceholder = form.homeTeamPlaceholder
    if (form.awayTeamId) body.awayTeamId = form.awayTeamId
    else if (form.awayTeamPlaceholder) body.awayTeamPlaceholder = form.awayTeamPlaceholder

    const res = await fetch('/api/admin/matches', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    setCreating(false)
    if (res.ok) {
      setCreateMsg('Partido creado')
      setForm({ phaseId: '', homeTeamId: '', awayTeamId: '', kickoffAt: '', homeTeamPlaceholder: '', awayTeamPlaceholder: '' })
      load()
      setTab('list')
    } else {
      setCreateMsg(data.error ?? 'Error al crear partido')
    }
  }

  async function handleEnterScore(matchId: string) {
    const home = parseInt(scoreForm.homeScore)
    const away = parseInt(scoreForm.awayScore)
    if (isNaN(home) || isNaN(away)) return

    const body: Record<string, unknown> = {
      homeScoreResult: home,
      awayScoreResult: away,
      status: 'completed',
    }
    if (scoreForm.homePen !== '' && scoreForm.awayPen !== '') {
      body.homeScorePen = parseInt(scoreForm.homePen)
      body.awayScorePen = parseInt(scoreForm.awayPen)
    }

    const res = await fetch(`/api/admin/matches/${matchId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) {
      setScoring(null)
      setScoreForm({ homeScore: '', awayScore: '', homePen: '', awayPen: '' })
      load()
    }
  }

  const inputCls = "w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ui-textMain">Partidos</h1>
        <div className="flex gap-1.5">
          {(['list', 'create'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                tab === t ? 'bg-ev26-purple/15 border-ev26-purple/40 text-ui-textMain' : 'border-white/10 text-ui-textMuted hover:text-ui-textMain'
              }`}
            >
              {t === 'list' ? 'Lista' : '+ Crear'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'create' && (
        <div className="bg-orion-surface rounded-xl p-5 border border-white/5">
          <h2 className="font-semibold text-ui-textMain mb-4">Nuevo partido</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-ui-textMuted mb-1">Fase *</label>
              <select value={form.phaseId} onChange={(e) => setForm((f) => ({ ...f, phaseId: e.target.value }))}
                required className={inputCls}>
                <option value="">Seleccionar fase…</option>
                {phases.map((p) => <option key={p.id} value={p.id}>{p.name_es} (×{p.fibonacci_factor})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Local — Equipo</label>
                <select value={form.homeTeamId} onChange={(e) => setForm((f) => ({ ...f, homeTeamId: e.target.value }))} className={inputCls}>
                  <option value="">Equipo o texto…</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {!form.homeTeamId && (
                  <input type="text" value={form.homeTeamPlaceholder}
                    onChange={(e) => setForm((f) => ({ ...f, homeTeamPlaceholder: e.target.value }))}
                    placeholder='Ej: "Ganador Grupo A"' className={`${inputCls} mt-1.5`} />
                )}
              </div>
              <div>
                <label className="block text-xs text-ui-textMuted mb-1">Visitante — Equipo</label>
                <select value={form.awayTeamId} onChange={(e) => setForm((f) => ({ ...f, awayTeamId: e.target.value }))} className={inputCls}>
                  <option value="">Equipo o texto…</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {!form.awayTeamId && (
                  <input type="text" value={form.awayTeamPlaceholder}
                    onChange={(e) => setForm((f) => ({ ...f, awayTeamPlaceholder: e.target.value }))}
                    placeholder='Ej: "Ganador Grupo B"' className={`${inputCls} mt-1.5`} />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-ui-textMuted mb-1">Fecha y hora de inicio *</label>
              <input type="datetime-local" value={form.kickoffAt}
                onChange={(e) => setForm((f) => ({ ...f, kickoffAt: e.target.value }))}
                required className={inputCls} />
            </div>
            {createMsg && <p className={`text-xs ${createMsg.includes('Error') ? 'text-ui-cta' : 'text-ev26-cyan'}`}>{createMsg}</p>}
            <button type="submit" disabled={creating} className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              {creating ? 'Creando…' : 'Crear partido'}
            </button>
          </form>
        </div>
      )}

      {tab === 'list' && (
        loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-orion-surface rounded-xl h-16 border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match) => {
              const homeLabel = match.home_team?.name ?? match.home_team_placeholder ?? '?'
              const awayLabel = match.away_team?.name ?? match.away_team_placeholder ?? '?'

              return (
                <div key={match.id} className="bg-orion-surface rounded-xl px-4 py-3 border border-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ui-textMain truncate">{homeLabel} vs {awayLabel}</p>
                      <p className="text-xs text-ui-textMuted">
                        {match.phase.name_es} · {format(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: es })}
                      </p>
                      {match.status === 'completed' && (
                        <p className="text-xs text-ev26-cyan font-medium">
                          {match.home_score_result} – {match.away_score_result}
                          {match.home_score_pen !== null && ` (pen. ${match.home_score_pen}–${match.away_score_pen})`}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                        match.status === 'completed' ? 'text-ui-textMuted bg-white/5 border-white/10' :
                        match.status === 'live' ? 'text-ui-cta bg-ui-cta/10 border-ui-cta/20 animate-pulse' :
                        'text-yellow-300 bg-yellow-500/10 border-yellow-500/20'
                      }`}>
                        {match.status === 'completed' ? 'Finalizado' : match.status === 'live' ? 'En vivo' : 'Programado'}
                      </span>

                      {match.status !== 'completed' && (
                        <button
                          onClick={() => { setScoring(match.id); setScoreForm({ homeScore: '', awayScore: '', homePen: '', awayPen: '' }) }}
                          className="text-xs border border-ev26-purple/50 text-ev26-cyan hover:bg-ev26-purple/10 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          Ingresar resultado
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Score entry inline */}
                  {scoring === match.id && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-ui-textMuted mb-2">Resultado final (tiempo reglamentario + prórroga, sin penaltis)</p>
                      <div className="flex gap-2 items-end flex-wrap">
                        <div>
                          <p className="text-[10px] text-ui-textMuted mb-1 truncate max-w-[80px]">{homeLabel}</p>
                          <input type="number" min={0} max={99} value={scoreForm.homeScore}
                            onChange={(e) => setScoreForm((f) => ({ ...f, homeScore: e.target.value }))}
                            className="w-16 bg-orion-bg border border-white/20 rounded-lg px-2 py-1.5 text-center text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"
                            placeholder="0" />
                        </div>
                        <span className="text-ui-textMuted pb-2">–</span>
                        <div>
                          <p className="text-[10px] text-ui-textMuted mb-1 truncate max-w-[80px]">{awayLabel}</p>
                          <input type="number" min={0} max={99} value={scoreForm.awayScore}
                            onChange={(e) => setScoreForm((f) => ({ ...f, awayScore: e.target.value }))}
                            className="w-16 bg-orion-bg border border-white/20 rounded-lg px-2 py-1.5 text-center text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"
                            placeholder="0" />
                        </div>
                        <div>
                          <p className="text-[10px] text-ui-textMuted mb-1">Pen. local</p>
                          <input type="number" min={0} max={99} value={scoreForm.homePen}
                            onChange={(e) => setScoreForm((f) => ({ ...f, homePen: e.target.value }))}
                            className="w-16 bg-orion-bg border border-white/10 rounded-lg px-2 py-1.5 text-center text-sm text-ui-textMuted focus:outline-none focus:border-ev26-purple"
                            placeholder="—" />
                        </div>
                        <div>
                          <p className="text-[10px] text-ui-textMuted mb-1">Pen. visit.</p>
                          <input type="number" min={0} max={99} value={scoreForm.awayPen}
                            onChange={(e) => setScoreForm((f) => ({ ...f, awayPen: e.target.value }))}
                            className="w-16 bg-orion-bg border border-white/10 rounded-lg px-2 py-1.5 text-center text-sm text-ui-textMuted focus:outline-none focus:border-ev26-purple"
                            placeholder="—" />
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <button onClick={() => setScoring(null)}
                            className="text-xs border border-white/10 text-ui-textMuted px-3 py-1.5 rounded-lg hover:text-ui-textMain transition-colors">
                            Cancelar
                          </button>
                          <button onClick={() => handleEnterScore(match.id)}
                            disabled={scoreForm.homeScore === '' || scoreForm.awayScore === ''}
                            className="text-xs bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors">
                            Guardar resultado
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {!matches.length && (
              <div className="bg-orion-surface rounded-xl p-8 text-center border border-white/5">
                <p className="text-ui-textMuted text-sm">No hay partidos. Crea el primero.</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
