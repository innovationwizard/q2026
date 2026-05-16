'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EnrollmentRow {
  id:                   string
  payment_status:       'pending' | 'confirmed' | 'refunded'
  registered_at:        string
  payment_confirmed_at: string | null
  user: {
    id:        string
    email:     string
    full_name: string
    phone:     string | null
  }
}

type Filter = 'all' | 'pending' | 'confirmed' | 'refunded'

export default function AdminPaymentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [processing,  setProcessing]  = useState<string | null>(null)
  const [confirm,     setConfirm]     = useState<{ id: string; action: 'confirm' | 'refund'; name: string } | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/admin/payments')
      .then((r) => r.json())
      .then(({ enrollments }) => setEnrollments(enrollments ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAction(id: string, action: 'confirm' | 'refund') {
    setProcessing(id)
    const res = await fetch(`/api/admin/payments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    })
    setProcessing(null)
    setConfirm(null)
    if (res.ok) {
      load()
    }
  }

  const filtered = enrollments.filter((e) => filter === 'all' || e.payment_status === filter)
  const counts   = {
    pending:   enrollments.filter((e) => e.payment_status === 'pending').length,
    confirmed: enrollments.filter((e) => e.payment_status === 'confirmed').length,
    refunded:  enrollments.filter((e) => e.payment_status === 'refunded').length,
  }

  const statusBadge = (s: EnrollmentRow['payment_status']) =>
    s === 'confirmed' ? 'text-ev26-cyan bg-ev26-cyan/10 border-ev26-cyan/20' :
    s === 'pending'   ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/20' :
                        'text-ui-textMuted bg-white/5 border-white/10'

  const statusLabel = (s: EnrollmentRow['payment_status']) =>
    s === 'confirmed' ? 'Confirmado' :
    s === 'pending'   ? 'Pendiente'  :
                        'Reembolsado'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ui-textMain">Gestión de pagos</h1>
        <span className="text-xs text-ui-textMuted">{enrollments.length} registrados</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-orion-surface rounded-xl p-3 border border-yellow-500/20 text-center">
          <p className="text-2xl font-bold text-yellow-300 tabular-nums">{counts.pending}</p>
          <p className="text-[10px] text-ui-textMuted mt-0.5">Pendientes</p>
        </div>
        <div className="bg-orion-surface rounded-xl p-3 border border-ev26-cyan/20 text-center">
          <p className="text-2xl font-bold text-ev26-cyan tabular-nums">{counts.confirmed}</p>
          <p className="text-[10px] text-ui-textMuted mt-0.5">Confirmados</p>
        </div>
        <div className="bg-orion-surface rounded-xl p-3 border border-white/10 text-center">
          <p className="text-2xl font-bold text-ui-textMuted tabular-nums">{counts.refunded}</p>
          <p className="text-[10px] text-ui-textMuted mt-0.5">Reembolsados</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5">
        {(['all', 'pending', 'confirmed', 'refunded'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === f
                ? 'bg-ev26-purple/15 border-ev26-purple/40 text-ui-textMain'
                : 'border-white/10 text-ui-textMuted hover:text-ui-textMain'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'confirmed' ? 'Confirmados' : 'Reembolsados'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-orion-surface rounded-xl h-16 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((e) => (
            <div key={e.id} className="bg-orion-surface rounded-xl px-4 py-3 border border-white/5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ui-textMain truncate">{e.user.full_name}</p>
                  <p className="text-xs text-ui-textMuted truncate">{e.user.email}</p>
                  {e.user.phone && <p className="text-xs text-ui-textMuted">{e.user.phone}</p>}
                  <p className="text-[10px] text-ui-textMuted mt-1">
                    Registrado: {format(new Date(e.registered_at), "d MMM yyyy · HH:mm", { locale: es })}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusBadge(e.payment_status)}`}>
                    {statusLabel(e.payment_status)}
                  </span>

                  {e.payment_status === 'pending' && (
                    <button
                      onClick={() => setConfirm({ id: e.id, action: 'confirm', name: e.user.full_name })}
                      disabled={processing === e.id}
                      className="text-xs bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  )}

                  {e.payment_status === 'confirmed' && (
                    <button
                      onClick={() => setConfirm({ id: e.id, action: 'refund', name: e.user.full_name })}
                      disabled={processing === e.id}
                      className="text-xs border border-ui-cta/50 text-ui-cta hover:bg-ui-cta/10 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Reembolsar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!filtered.length && (
            <div className="bg-orion-surface rounded-xl p-8 text-center border border-white/5">
              <p className="text-ui-textMuted text-sm">No hay registros en este estado.</p>
            </div>
          )}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-orion-surface rounded-2xl p-6 max-w-sm w-full border border-white/10">
            <h3 className="font-semibold text-ui-textMain mb-2">
              {confirm.action === 'confirm' ? 'Confirmar pago' : 'Reembolsar pago'}
            </h3>
            <p className="text-sm text-ui-textMuted mb-6">
              {confirm.action === 'confirm'
                ? `¿Confirmar el pago de ${confirm.name}? Esto los activará en la quiniela.`
                : `¿Reembolsar a ${confirm.name}? Los eliminará de la clasificación.`
              }
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 border border-white/10 text-ui-textMuted hover:text-ui-textMain py-2 rounded-lg text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction(confirm.id, confirm.action)}
                disabled={!!processing}
                className={`flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ${
                  confirm.action === 'confirm'
                    ? 'bg-ev26-purple hover:bg-ev26-purple/90 text-white'
                    : 'bg-ui-cta hover:bg-ui-cta/90 text-white'
                }`}
              >
                {processing ? 'Procesando…' : confirm.action === 'confirm' ? 'Confirmar' : 'Reembolsar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
