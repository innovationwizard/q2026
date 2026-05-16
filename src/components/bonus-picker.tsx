'use client'

import { useState } from 'react'
import { Team } from '@/types/database'

interface BonusPickerProps {
  teams:        Team[]
  tournamentId: string
  startsAt:     string
  initialChampion:  string | null
  initialFinalist1: string | null
  initialFinalist2: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function TeamSelect({ label, teams, value, onChange, disabled, exclude }: {
  label:    string
  teams:    Team[]
  value:    string
  onChange: (v: string) => void
  disabled: boolean
  exclude:  string[]
}) {
  const available = teams.filter((t) => !exclude.includes(t.id) || t.id === value)
  return (
    <div>
      <label className="block text-xs text-ui-textMuted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">Seleccionar equipo…</option>
        {available.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  )
}

export default function BonusPicker({
  teams, tournamentId, startsAt, initialChampion, initialFinalist1, initialFinalist2,
}: BonusPickerProps) {
  const [champion,  setChampion]  = useState(initialChampion  ?? '')
  const [finalist1, setFinalist1] = useState(initialFinalist1 ?? '')
  const [finalist2, setFinalist2] = useState(initialFinalist2 ?? '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null)

  const isLocked = new Date() >= new Date(startsAt)
  const canSave  = champion && finalist1 && finalist2 && finalist1 !== finalist2

  async function handleSave() {
    if (!canSave || isLocked) return
    setSaveState('saving')
    setErrorMsg(null)

    const res = await fetch('/api/predictions/bonus', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tournamentId, champion, finalist1, finalist2 }),
    })

    if (res.ok) {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      const data = await res.json()
      setErrorMsg(data.error ?? 'Error al guardar')
      setSaveState('error')
    }
  }

  return (
    <div className="space-y-4">
      {isLocked && (
        <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-ui-textMuted">
          🔒 El período de predicciones bonus cerró al inicio del torneo.
        </div>
      )}

      <TeamSelect
        label="Campeón del Evento"
        teams={teams}
        value={champion}
        onChange={setChampion}
        disabled={isLocked}
        exclude={[finalist1, finalist2]}
      />

      <TeamSelect
        label="Finalista 1"
        teams={teams}
        value={finalist1}
        onChange={setFinalist1}
        disabled={isLocked}
        exclude={[finalist2]}
      />

      <TeamSelect
        label="Finalista 2"
        teams={teams}
        value={finalist2}
        onChange={setFinalist2}
        disabled={isLocked}
        exclude={[finalist1]}
      />

      {errorMsg && <p className="text-sm text-ui-cta">{errorMsg}</p>}

      {!isLocked && (
        <button
          onClick={handleSave}
          disabled={!canSave || saveState === 'saving'}
          className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? '✓ Guardado' : 'Guardar predicciones bonus'}
        </button>
      )}
    </div>
  )
}
