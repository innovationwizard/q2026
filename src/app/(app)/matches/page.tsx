'use client'

import { useState, useEffect } from 'react'
import PhaseNav from '@/components/phase-nav'
import MatchCard from '@/components/match-card'
import { Phase, MatchWithTeams, Prediction, MatchScore } from '@/types/database'

interface MatchWithPred extends MatchWithTeams {
  prediction: Prediction | null
  score:      MatchScore | null
}

export default function MatchesPage() {
  const [phases,      setPhases]      = useState<Phase[]>([])
  const [matches,     setMatches]     = useState<MatchWithPred[]>([])
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    fetch('/api/admin/teams')
      .then((r) => r.json())
      .catch(() => null)

    fetch('/api/matches')
      .then((r) => r.json())
      .then(({ matches: raw }) => {
        if (!raw) return
        const phaseMap = new Map<string, Phase>()
        raw.forEach((m: MatchWithTeams) => phaseMap.set(m.phase.id, m.phase))
        setPhases(Array.from(phaseMap.values()).sort((a, b) => a.sort_order - b.sort_order))
        setMatches(raw.map((m: MatchWithTeams) => ({ ...m, prediction: null, score: null })))
      })
      .finally(() => setLoading(false))
  }, [])

  // Load user predictions for displayed matches
  useEffect(() => {
    if (!matches.length) return

    const matchIds = matches
      .filter((m) => selectedPhase === null || m.phase_id === selectedPhase)
      .map((m) => m.id)

    if (!matchIds.length) return

    Promise.all([
      fetch('/api/predictions').then((r) => r.json()),
    ]).then(([{ predictions }]) => {
      const predMap = new Map<string, Prediction>((predictions ?? []).map((p: Prediction) => [p.match_id, p] as [string, Prediction]))
      setMatches((prev) =>
        prev.map((m) => ({ ...m, prediction: (predMap.get(m.id) as Prediction | undefined) ?? null }))
      )
    })
  }, [matches.length, selectedPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = selectedPhase
    ? matches.filter((m) => m.phase_id === selectedPhase)
    : matches

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-ui-textMain">Partidos</h1>

      <PhaseNav phases={phases} selectedPhaseId={selectedPhase} onSelect={setSelectedPhase} />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-orion-surface rounded-xl h-32 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="bg-orion-surface rounded-xl p-8 text-center border border-white/5">
          <p className="text-ui-textMuted text-sm">No hay partidos en esta fase aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={match.prediction}
              score={match.score}
            />
          ))}
        </div>
      )}
    </div>
  )
}
