'use client'

import { LeaderboardEntryWithUser } from '@/types/database'

interface LeaderboardTableProps {
  entries:       LeaderboardEntryWithUser[]
  currentUserId: string
}

function RankChange({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return <span className="text-ui-textMuted">—</span>
  const delta = previous - current
  if (delta > 0) return <span className="text-ev26-cyan text-xs font-medium">↑{delta}</span>
  if (delta < 0) return <span className="text-ui-cta text-xs font-medium">↓{Math.abs(delta)}</span>
  return <span className="text-ui-textMuted text-xs">—</span>
}

export default function LeaderboardTable({ entries, currentUserId }: LeaderboardTableProps) {
  if (!entries.length) {
    return (
      <div className="bg-orion-surface rounded-xl p-8 text-center border border-white/5">
        <p className="text-ui-textMuted text-sm">La clasificación estará disponible cuando se complete el primer partido.</p>
      </div>
    )
  }

  return (
    <div className="bg-orion-surface rounded-xl border border-white/5 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-ui-textMuted">
            <th className="text-left px-4 py-3 w-10">#</th>
            <th className="text-left px-4 py-3">Participante</th>
            <th className="text-right px-4 py-3">Pts</th>
            <th className="text-right px-4 py-3 hidden sm:table-cell">Exactos</th>
            <th className="text-right px-4 py-3 hidden md:table-cell">KO Pts</th>
            <th className="text-right px-4 py-3 hidden sm:table-cell">Δ</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const isCurrentUser = entry.user_id === currentUserId
            const isTop3        = (entry.rank ?? 0) <= 3

            return (
              <tr
                key={entry.id}
                className={`border-b border-white/5 last:border-0 transition-colors ${
                  isCurrentUser
                    ? 'bg-ev26-purple/10 border-l-2 border-l-ev26-purple'
                    : 'hover:bg-white/3'
                }`}
              >
                <td className="px-4 py-3 w-10">
                  <span className={`font-bold tabular-nums ${
                    entry.rank === 1 ? 'text-yellow-400' :
                    entry.rank === 2 ? 'text-slate-300'  :
                    entry.rank === 3 ? 'text-amber-600'  :
                    'text-ui-textMuted'
                  }`}>
                    {entry.rank ?? idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-ev26-purple/20 flex items-center justify-center text-xs font-semibold text-ev26-cyan flex-shrink-0">
                      {entry.user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`font-medium truncate max-w-[140px] ${isCurrentUser ? 'text-ui-textMain' : 'text-ui-textMuted'}`}>
                      {entry.user.full_name}
                      {isCurrentUser && <span className="text-[10px] text-ev26-cyan ml-1">(tú)</span>}
                    </span>
                    {isTop3 && (
                      <span className="text-sm">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold tabular-nums text-ui-textMain">{entry.grand_total}</span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="tabular-nums text-ui-textMuted">{entry.exact_result_count}</span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="tabular-nums text-ui-textMuted">{entry.knockout_points}</span>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <RankChange current={entry.rank} previous={entry.previous_rank} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
