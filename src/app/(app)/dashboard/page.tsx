import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import CountdownTimer from '@/components/countdown-timer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: tournament },
    { data: upcomingRaw },
    { data: lbEntry },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('tournaments').select('*').eq('slug', 'quiniela').single(),
    supabase
      .from('matches')
      .select(`*, phase:phases(*), home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*)`)
      .eq('status', 'scheduled')
      .gte('kickoff_at', new Date().toISOString())
      .order('kickoff_at', { ascending: true })
      .limit(5),
    supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const enrollment = tournament
    ? await supabase
        .from('enrollments')
        .select('*')
        .eq('tournament_id', tournament.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : null

  const predictionMatchIds = upcomingRaw?.map((m) => m.id) ?? []
  const { data: predictions } = predictionMatchIds.length
    ? await supabase.from('predictions').select('match_id, home_score, away_score').eq('user_id', user.id).in('match_id', predictionMatchIds)
    : { data: [] }

  const predMap = new Map(predictions?.map((p) => [p.match_id, p]) ?? [])

  const isEnrolled  = !!enrollment?.data
  const isPending   = enrollment?.data?.payment_status === 'pending'
  const isConfirmed = enrollment?.data?.payment_status === 'confirmed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ui-textMain">
          Hola, {profile?.full_name?.split(' ')[0] ?? 'bienvenido'}
        </h1>
        <p className="text-ui-textMuted text-sm mt-0.5">Evento 2026</p>
      </div>

      {/* Enrollment CTA */}
      {!isEnrolled && tournament && (
        <div className="bg-ev26-purple/10 border border-ev26-purple/30 rounded-xl p-5">
          <h2 className="font-semibold text-ui-textMain mb-1">Regístrate en la quiniela</h2>
          <p className="text-sm text-ui-textMuted mb-4">
            Costo de inscripción: <span className="font-bold text-ui-textMain">Q{tournament.entry_fee_gtq}</span>
          </p>
          <Link href="/profile" className="inline-flex items-center gap-2 bg-ev26-purple hover:bg-ev26-purple/90 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Inscribirme →
          </Link>
        </div>
      )}

      {isPending && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200">
          ⏳ Tu inscripción está pendiente de confirmación de pago. Un administrador la activará pronto.
        </div>
      )}

      {/* Stats row */}
      {isConfirmed && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orion-surface rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-ui-textMain tabular-nums">{lbEntry?.data?.grand_total ?? 0}</p>
            <p className="text-[10px] text-ui-textMuted uppercase tracking-wider mt-1">Puntos</p>
          </div>
          <div className="bg-orion-surface rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-ui-textMain tabular-nums">{lbEntry?.data?.rank ?? '—'}</p>
            <p className="text-[10px] text-ui-textMuted uppercase tracking-wider mt-1">Posición</p>
          </div>
          <div className="bg-orion-surface rounded-xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-ui-textMain tabular-nums">{lbEntry?.data?.exact_result_count ?? 0}</p>
            <p className="text-[10px] text-ui-textMuted uppercase tracking-wider mt-1">Exactos</p>
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ui-textMain">Próximos partidos</h2>
          <Link href="/matches" className="text-xs text-ui-textMuted hover:text-ui-textMain transition-colors">Ver todos →</Link>
        </div>

        {!upcomingRaw?.length ? (
          <div className="bg-orion-surface rounded-xl p-6 text-center border border-white/5">
            <p className="text-ui-textMuted text-sm">No hay partidos próximos programados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingRaw.map((match) => {
              const pred = predMap.get(match.id)
              const hasPred = !!pred

              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center gap-3 bg-orion-surface rounded-xl px-4 py-3 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ui-textMain truncate">
                      {(match.home_team as {name: string} | null)?.name ?? match.home_team_placeholder ?? '?'}
                      {' '}vs{' '}
                      {(match.away_team as {name: string} | null)?.name ?? match.away_team_placeholder ?? '?'}
                    </p>
                    <p className="text-xs text-ui-textMuted mt-0.5">
                      {format(new Date(match.kickoff_at), "EEE d MMM · HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasPred ? (
                      <span className="text-xs text-ev26-cyan font-medium tabular-nums">
                        {pred.home_score}–{pred.away_score}
                      </span>
                    ) : isConfirmed ? (
                      <span className="text-[10px] text-ui-cta">Sin predicción</span>
                    ) : null}
                    <CountdownTimer cutoffAt={match.prediction_cutoff_at} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
