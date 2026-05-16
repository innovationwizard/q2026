import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CountdownTimer from '@/components/countdown-timer'
import PredictionInput from '@/components/prediction-input'

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: match } = await supabase
    .from('matches')
    .select(`*, phase:phases(*), home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`)
    .eq('id', id)
    .single()

  if (!match) notFound()

  const [{ data: prediction }, { data: score }] = await Promise.all([
    user
      ? supabase.from('predictions').select('*').eq('match_id', id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('match_scores').select('*').eq('match_id', id).eq('user_id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const isCompleted = match.status === 'completed'
  const isLive      = match.status === 'live' || match.status === 'half_time'
  const phase       = match.phase as { name_es: string; fibonacci_factor: number }
  const homeTeam    = match.home_team as { name: string; code: string } | null
  const awayTeam    = match.away_team as { name: string; code: string } | null

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back */}
      <a href="/matches" className="text-sm text-ui-textMuted hover:text-ui-textMain transition-colors">← Volver</a>

      {/* Match card */}
      <div className="bg-orion-surface rounded-2xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-ui-textMuted">{phase.name_es}</span>
            <span className="ml-2 text-xs text-ev26-cyan font-medium">×{phase.fibonacci_factor}</span>
          </div>
          {isLive && <span className="text-xs text-ui-cta font-bold animate-pulse uppercase">● En vivo</span>}
          {isCompleted && <span className="text-xs text-ui-textMuted">Finalizado</span>}
          {!isCompleted && !isLive && <CountdownTimer cutoffAt={match.prediction_cutoff_at} />}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-sm font-bold text-ui-textMuted">{homeTeam?.code ?? '?'}</span>
            </div>
            <span className="text-sm font-semibold text-ui-textMain text-center">
              {homeTeam?.name ?? match.home_team_placeholder ?? 'Por definir'}
            </span>
          </div>

          <div className="text-center flex-shrink-0">
            {isCompleted ? (
              <div className="text-4xl font-bold tabular-nums text-ui-textMain">
                {match.home_score_result} – {match.away_score_result}
              </div>
            ) : (
              <div className="text-2xl font-bold text-ui-textMuted">vs</div>
            )}
            <p className="text-xs text-ui-textMuted mt-1">
              {format(new Date(match.kickoff_at), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
            </p>
            {isCompleted && match.home_score_pen !== null && (
              <p className="text-xs text-ui-textMuted mt-1">
                Penaltis: {match.home_score_pen} – {match.away_score_pen}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-sm font-bold text-ui-textMuted">{awayTeam?.code ?? '?'}</span>
            </div>
            <span className="text-sm font-semibold text-ui-textMain text-center">
              {awayTeam?.name ?? match.away_team_placeholder ?? 'Por definir'}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction section */}
      <div className="bg-orion-surface rounded-2xl p-6 border border-white/5">
        <h2 className="font-semibold text-ui-textMain mb-4">Tu predicción</h2>

        {isCompleted ? (
          <div className="space-y-3">
            {prediction ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ui-textMuted">Tu marcador</span>
                  <span className="text-sm font-bold tabular-nums text-ui-textMain">
                    {prediction.home_score} – {prediction.away_score}
                  </span>
                </div>
                {score && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ui-textMuted">Resultado</span>
                      <div className="flex gap-2">
                        {score.correct_exact  && <span className="text-xs text-ev26-cyan bg-ev26-cyan/10 px-2 py-0.5 rounded-full">Exacto</span>}
                        {!score.correct_exact && score.correct_winner && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Ganador</span>}
                        {!score.correct_exact && score.correct_draw   && <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Empate</span>}
                        {!score.correct_exact && !score.correct_winner && !score.correct_draw && (
                          <span className="text-xs text-ui-textMuted bg-white/5 px-2 py-0.5 rounded-full">Sin puntos</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-sm font-semibold text-ui-textMain">Puntos ganados</span>
                      <span className="text-lg font-bold text-ev26-cyan tabular-nums">+{score.total_points}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-ui-textMuted">No enviaste una predicción para este partido.</p>
            )}
          </div>
        ) : (
          <PredictionInput
            matchId={match.id}
            initialHome={prediction?.home_score ?? null}
            initialAway={prediction?.away_score ?? null}
            cutoffAt={match.prediction_cutoff_at}
            matchStatus={match.status}
          />
        )}
      </div>

      {/* Scoring reference */}
      <div className="bg-orion-surface rounded-2xl p-5 border border-white/5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ui-textMuted mb-3">Puntuación</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-ui-textMuted">Ganador / Empate correcto</span>
            <span className="text-ui-textMain font-medium">2 × {phase.fibonacci_factor} = {2 * phase.fibonacci_factor}pts</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ui-textMuted">Marcador exacto</span>
            <span className="text-ev26-cyan font-medium">7 × {phase.fibonacci_factor} = {7 * phase.fibonacci_factor}pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}
