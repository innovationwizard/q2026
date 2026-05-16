'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database'

interface NavProps {
  role: UserRole
  fullName: string
}

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Inicio',       icon: '⌂' },
  { href: '/matches',     label: 'Partidos',      icon: '⚽' },
  { href: '/leaderboard', label: 'Clasificación', icon: '🏆' },
  { href: '/profile',     label: 'Perfil',        icon: '👤' },
]

const ADMIN_ITEMS = [
  { href: '/admin/payments', label: 'Pagos',   icon: '💳' },
  { href: '/admin/matches',  label: 'Partidos', icon: '⚙' },
  { href: '/admin/teams',    label: 'Equipos',  icon: '🌐' },
]

export default function Nav({ role, fullName }: NavProps) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-orion-surface border-r border-white/5 fixed left-0 top-0 bottom-0 z-40">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ev26-purple flex items-center justify-center text-sm flex-shrink-0">⚽</div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-ui-textMain leading-none">Quiniela</p>
              <p className="text-[10px] text-ui-textMuted mt-0.5">Evento 2026</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-ev26-purple/15 text-ui-textMain border border-ev26-purple/30'
                    : 'text-ui-textMuted hover:text-ui-textMain hover:bg-white/5'
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          {role === 'admin' && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-[10px] uppercase tracking-widest text-ui-textMuted font-semibold">Admin</p>
              </div>
              {ADMIN_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-ev26-purple/15 text-ui-textMain border border-ev26-purple/30'
                        : 'text-ui-textMuted hover:text-ui-textMain hover:bg-white/5'
                    }`}
                  >
                    <span className="text-base w-5 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-ev26-purple/30 flex items-center justify-center text-xs flex-shrink-0 font-semibold text-ev26-cyan">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ui-textMain truncate">{fullName}</p>
              {role === 'admin' && (
                <p className="text-[10px] text-ev26-cyan">Admin</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full mt-1 text-left px-3 py-2 text-xs text-ui-textMuted hover:text-ui-cta transition-colors rounded-lg hover:bg-white/5"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-orion-surface border-t border-white/5 flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 text-[10px] transition-colors ${
                active ? 'text-ev26-cyan' : 'text-ui-textMuted'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
