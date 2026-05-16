'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PredictionInputProps {
  matchId:        string
  initialHome:    number | null
  initialAway:    number | null
  cutoffAt:       string
  matchStatus:    string
  onSaved?:       (home: number, away: number) => void
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function PredictionInput({
  matchId, initialHome, initialAway, cutoffAt, matchStatus, onSaved,
}: PredictionInputProps) {
  const [home, setHome]         = useState<string>(initialHome !== null ? String(initialHome) : '')
  const [away, setAway]         = useState<string>(initialAway !== null ? String(initialAway) : '')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLocked = matchStatus !== 'scheduled' || new Date() >= new Date(cutoffAt)

  const save = useCallback(async (h: string, a: string) => {
    const homeInt = parseInt(h)
    const awayInt = parseInt(a)
    if (isNaN(homeInt) || isNaN(awayInt)) return

    setSaveState('saving')
    const supabase = createClient()
    const res = await fetch(`/api/predictions/${matchId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ homeScore: homeInt, awayScore: awayInt }),
    })

    if (res.ok) {
      setSaveState('saved')
      onSaved?.(homeInt, awayInt)
      setTimeout(() => setSaveState('idle'), 2000)
    } else {
      const data = await res.json()
      setSaveState('error')
      console.error('Prediction save error:', data.error)
      setTimeout(() => setSaveState('idle'), 3000)
    }
  }, [matchId, onSaved])

  function handleChange(side: 'home' | 'away', value: string) {
    const clamped = value === '' ? '' : String(Math.max(0, Math.min(99, parseInt(value) || 0)))
    if (side === 'home') setHome(clamped)
    else                 setAway(clamped)

    const h = side === 'home' ? clamped : home
    const a = side === 'away' ? clamped : away

    if (h !== '' && a !== '') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => save(h, a), 800)
    }
  }

  const inputClass = `
    w-12 h-12 rounded-xl text-center text-xl font-bold tabular-nums
    bg-orion-bg border transition-colors outline-none
    ${isLocked
      ? 'border-white/10 text-ui-textMuted cursor-not-allowed'
      : 'border-white/20 text-ui-textMain focus:border-ev26-purple'
    }
  `

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={0}
          max={99}
          value={home}
          onChange={(e) => handleChange('home', e.target.value)}
          disabled={isLocked}
          placeholder="—"
          className={inputClass}
        />
        <span className="text-ui-textMuted text-sm font-medium">vs</span>
        <input
          type="number"
          min={0}
          max={99}
          value={away}
          onChange={(e) => handleChange('away', e.target.value)}
          disabled={isLocked}
          placeholder="—"
          className={inputClass}
        />
      </div>

      <div className="h-4 flex items-center">
        {saveState === 'saving' && (
          <span className="text-[10px] text-ui-textMuted">Guardando…</span>
        )}
        {saveState === 'saved' && (
          <span className="text-[10px] text-ev26-cyan">✓ Guardado</span>
        )}
        {saveState === 'error' && (
          <span className="text-[10px] text-ui-cta">Error al guardar</span>
        )}
      </div>
    </div>
  )
}
