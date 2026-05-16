import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderboardTable from '@/components/leaderboard-table'
import { LeaderboardEntryWithUser } from '@/types/database'
import { calculatePrizes } from '@/lib/scoring/constants'

export const revalidate = 30

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', 'quiniela')
    .single()

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <p className="text-ui-textMuted">El torneo aún no está configurado.</p>
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('leaderboard')
    .select(`*, user:users(id, full_name, avatar_url)`)
    .eq('tournament_id', tournament.id)
    .order('rank', { ascending: true, nullsFirst: false })

  const { count: confirmedCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('payment_status', 'confirmed')

  const prizes = calculatePrizes(confirmedCount ?? 0, tournament.entry_fee_gtq)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ui-textMain">Clasificación</h1>
        <span className="text-xs text-ui-textMuted">{confirmedCount ?? 0} participantes</span>
      </div>

      {/* Prize pool */}
      {Number(confirmedCount ?? 0) > 0 && (
        <div className="bg-orion-surface rounded-xl border border-white/5 p-4">
          <p className="text-xs text-ui-textMuted uppercase tracking-wider mb-3 font-semibold">Premios · Pool Q{prizes.pool.toLocaleString()}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-yellow-400">Q{prizes.first.toLocaleString()}</p>
              <p className="text-[10px] text-ui-textMuted">🥇 1er lugar</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-300">Q{prizes.second.toLocaleString()}</p>
              <p className="text-[10px] text-ui-textMuted">🥈 2do lugar</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">Q{prizes.third.toLocaleString()}</p>
              <p className="text-[10px] text-ui-textMuted">🥉 3er lugar</p>
            </div>
          </div>
        </div>
      )}

      <LeaderboardTable
        entries={(entries ?? []) as LeaderboardEntryWithUser[]}
        currentUserId={user.id}
      />

      {/* Tiebreaker info */}
      <div className="bg-orion-surface rounded-xl p-4 border border-white/5">
        <p className="text-xs font-semibold text-ui-textMuted uppercase tracking-wider mb-2">Criterios de desempate</p>
        <ol className="text-xs text-ui-textMuted space-y-1 list-decimal list-inside">
          <li>Mayor cantidad de marcadores exactos</li>
          <li>Mayor puntuación en fase de eliminación</li>
          <li>Mayor cantidad de resultados correctos</li>
          <li>Registro más temprano</li>
        </ol>
      </div>
    </div>
  )
}
