'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CountdownTimer from './countdown-timer'
import PredictionInput from './prediction-input'
import { MatchWithTeams, Prediction, MatchScore } from '@/types/database'

interface MatchCardProps {
  match:      MatchWithTeams
  prediction: Prediction | null
  score:      MatchScore | null
  showInput?: boolean
}

function TeamDisplay({ name, placeholder, code }: { name?: string; placeholder?: string | null; code?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 w-24">
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg">
        {code ? (
          <span className="text-sm font-bold text-ui-textMuted">{code}</span>
        ) : (
          <span className="text-ui-textMuted text-xs">?</span>
        )}
      </div>
      <span className="text-xs text-center text-ui-textMain font-medium leading-tight line-clamp-2">
        {name ?? placeholder ?? 'Por definir'}
      </span>
    </div>
  )
}

function ScoreBadge({ score }: { score: MatchScore }) {
  const label =
    score.correct_exact  ? '✓ Exacto'  :
    score.correct_winner ? '✓ Ganador' :
    score.correct_draw   ? '✓ Empate'  :
    '✗ Sin puntos'

  const color =
    score.correct_exact  ? 'text-ev26-cyan border-ev26-cyan/30 bg-ev26-cyan/10'    :
    score.correct_winner ? 'text-green-400 border-green-400/30 bg-green-400/10'    :
    score.correct_draw   ? 'text-green-400 border-green-400/30 bg-green-400/10'    :
                           'text-ui-textMuted border-white/10 bg-white/5'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${color}`}>
      <span className="text-xs font-medium">{label}</span>
      {score.total_points > 0 && (
        <span className="text-xs font-bold">+{score.total_points}pts</span>
      )}
    </div>
  )
}

export default function MatchCard({ match, prediction, score, showInput = true }: MatchCardProps) {
  const isCompleted = match.status === 'completed'
  const isLive      = match.status === 'live' || match.status === 'half_time'

  return (
    <div className="bg-orion-surface rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
      {/* Phase + kickoff */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-wider text-ui-textMuted font-semibold">
          {match.phase.name_es} · ×{match.phase.fibonacci_factor}
        </span>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="text-[10px] text-ui-cta font-bold uppercase tracking-wider animate-pulse">● En vivo</span>
          )}
          {!isCompleted && !isLive && (
            <CountdownTimer cutoffAt={match.prediction_cutoff_at} />
          )}
          {isCompleted && (
            <span className="text-[10px] text-ui-textMuted">Finalizado</span>
          )}
        </div>
      </div>

      {/* Teams + score row */}
      <div className="flex items-center justify-between gap-2">
        <TeamDisplay
          name={match.home_team?.name}
          placeholder={match.home_team_placeholder}
          code={match.home_team?.code}
        />

        <div className="flex flex-col items-center gap-2 flex-1">
          {/* Result (completed) */}
          {isCompleted && match.home_score_result !== null && match.away_score_result !== null ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums text-ui-textMain">{match.home_score_result}</span>
              <span className="text-ui-textMuted">—</span>
              <span className="text-2xl font-bold tabular-nums text-ui-textMain">{match.away_score_result}</span>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-ui-textMuted mb-1">
                {format(new Date(match.kickoff_at), "d MMM · HH:mm", { locale: es })}
              </p>
            </div>
          )}

          {/* Prediction input or display */}
          {showInput && !isCompleted && (
            <PredictionInput
              matchId={match.id}
              initialHome={prediction?.home_score ?? null}
              initialAway={prediction?.away_score ?? null}
              cutoffAt={match.prediction_cutoff_at}
              matchStatus={match.status}
            />
          )}

          {/* Prediction result after match */}
          {isCompleted && prediction && (
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[10px] text-ui-textMuted">
                Tu predicción: <span className="text-ui-textMain font-medium">{prediction.home_score} – {prediction.away_score}</span>
              </p>
              {score && <ScoreBadge score={score} />}
            </div>
          )}

          {isCompleted && !prediction && (
            <p className="text-[10px] text-ui-textMuted">Sin predicción</p>
          )}
        </div>

        <TeamDisplay
          name={match.away_team?.name}
          placeholder={match.away_team_placeholder}
          code={match.away_team?.code}
        />
      </div>

      <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
        <Link
          href={`/matches/${match.id}`}
          className="text-[10px] text-ui-textMuted hover:text-ui-textMain transition-colors"
        >
          Ver detalle →
        </Link>
      </div>
    </div>
  )
}
