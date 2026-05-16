import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculatePrizes } from '@/lib/scoring/constants'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: tournament },
    { count: pendingCount },
    { count: confirmedCount },
    { count: matchCount },
    { count: teamCount },
  ] = await Promise.all([
    supabase.from('tournaments').select('*').eq('slug', 'quiniela').single(),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('payment_status', 'confirmed'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('teams').select('*', { count: 'exact', head: true }),
  ])

  const prizes = tournament ? calculatePrizes(confirmedCount ?? 0, tournament.entry_fee_gtq) : null

  const LINKS = [
    { href: '/admin/payments', label: 'Gestión de pagos', desc: `${pendingCount ?? 0} pendientes · ${confirmedCount ?? 0} confirmados`, icon: '💳', badge: pendingCount ?? 0 },
    { href: '/admin/matches',  label: 'Partidos',         desc: `${matchCount ?? 0} partidos configurados`,                              icon: '⚽', badge: 0 },
    { href: '/admin/teams',    label: 'Equipos',          desc: `${teamCount ?? 0} equipos registrados`,                                 icon: '🌐', badge: 0 },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ui-textMain">Panel de administración</h1>

      {tournament && (
        <div className="bg-orion-surface rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ui-textMain">{tournament.name}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
              tournament.status === 'active'       ? 'text-ev26-cyan bg-ev26-cyan/10 border-ev26-cyan/20' :
              tournament.status === 'registration' ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' :
                                                     'text-ui-textMuted bg-white/5 border-white/10'
            }`}>
              {tournament.status === 'active' ? 'Activo' : tournament.status === 'registration' ? 'Registro abierto' : 'Finalizado'}
            </span>
          </div>
          {prizes && (
            <div className="grid grid-cols-3 gap-3 text-center mt-3">
              <div>
                <p className="text-lg font-bold text-yellow-400">Q{prizes.first.toLocaleString()}</p>
                <p className="text-[10px] text-ui-textMuted">1er lugar</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-300">Q{prizes.second.toLocaleString()}</p>
                <p className="text-[10px] text-ui-textMuted">2do lugar</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-600">Q{prizes.third.toLocaleString()}</p>
                <p className="text-[10px] text-ui-textMuted">3er lugar</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-orion-surface rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors relative"
          >
            {link.badge > 0 && (
              <span className="absolute top-3 right-3 bg-ui-cta text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {link.badge}
              </span>
            )}
            <span className="text-2xl mb-3 block">{link.icon}</span>
            <p className="font-semibold text-ui-textMain">{link.label}</p>
            <p className="text-xs text-ui-textMuted mt-1">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
