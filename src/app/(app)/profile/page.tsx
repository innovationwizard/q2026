'use client'

import { useState, useEffect } from 'react'
import BonusPicker from '@/components/bonus-picker'
import { Team, Tournament, Enrollment } from '@/types/database'

interface ProfileData {
  id:        string
  full_name: string
  email:     string
  phone:     string | null
  role:      string
}

export default function ProfilePage() {
  const [profile,    setProfile]    = useState<ProfileData | null>(null)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [teams,      setTeams]      = useState<Team[]>([])
  const [bonusPreds, setBonusPreds] = useState<{ champion: string | null; finalist1: string | null; finalist2: string | null }>({ champion: null, finalist1: null, finalist2: null })

  const [fullName,  setFullName]  = useState('')
  const [phone,     setPhone]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveMsg,   setSaveMsg]   = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then((r) => r.json()),
      fetch('/api/tournament').then((r) => r.json()),
      fetch('/api/admin/teams').then((r) => r.json()),
    ]).then(([{ user }, { tournament, enrollment }, { teams }]) => {
      setProfile(user)
      setFullName(user?.full_name ?? '')
      setPhone(user?.phone ?? '')
      setTournament(tournament)
      setEnrollment(enrollment)
      setTeams(teams ?? [])

      if (tournament && enrollment) {
        fetch(`/api/predictions/bonus?tournament=${tournament.id}`)
          .then((r) => r.json())
          .then(({ bonusPredictions }) => {
            const champ = bonusPredictions?.find((b: {prediction_type: string; team_id: string}) => b.prediction_type === 'champion')
            const fin1  = bonusPredictions?.find((b: {prediction_type: string; team_id: string}) => b.prediction_type === 'finalist_1')
            const fin2  = bonusPredictions?.find((b: {prediction_type: string; team_id: string}) => b.prediction_type === 'finalist_2')
            setBonusPreds({
              champion:  champ?.team_id ?? null,
              finalist1: fin1?.team_id  ?? null,
              finalist2: fin2?.team_id  ?? null,
            })
          })
      }
    })
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg(null)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone }),
    })
    setSaving(false)
    if (res.ok) {
      setSaveMsg('Perfil actualizado')
      setTimeout(() => setSaveMsg(null), 2000)
    } else {
      const d = await res.json()
      setSaveMsg(d.error ?? 'Error al guardar')
    }
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!tournament) return
    setEnrolling(true)
    setEnrollMsg(null)
    const res = await fetch('/api/tournament/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: tournament.id, fullName, phone }),
    })
    const data = await res.json()
    setEnrolling(false)
    if (res.ok) {
      setEnrollment(data.enrollment)
      setEnrollMsg('¡Inscripción enviada! Espera confirmación de pago.')
    } else {
      setEnrollMsg(data.error ?? 'Error al inscribirse')
    }
  }

  if (!profile) {
    return (
      <div className="space-y-3">
        {[1,2,3].map((i) => <div key={i} className="bg-orion-surface rounded-xl h-24 border border-white/5 animate-pulse" />)}
      </div>
    )
  }

  const isEnrolled  = !!enrollment
  const isPending   = enrollment?.payment_status === 'pending'
  const isConfirmed = enrollment?.payment_status === 'confirmed'

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-ui-textMain">Mi perfil</h1>

      {/* Profile form */}
      <div className="bg-orion-surface rounded-xl p-5 border border-white/5">
        <h2 className="font-semibold text-ui-textMain mb-4">Información personal</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs text-ui-textMuted mb-1">Nombre completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"
            />
          </div>
          <div>
            <label className="block text-xs text-ui-textMuted mb-1">Correo electrónico</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMuted opacity-60 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-ui-textMuted mb-1">
              WhatsApp <span className="text-[10px]">(opcional — para recordatorios)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+502 0000 0000"
              className="w-full bg-orion-bg border border-white/10 rounded-lg px-3 py-2 text-sm text-ui-textMain focus:outline-none focus:border-ev26-purple"
            />
          </div>
          {saveMsg && <p className={`text-xs ${saveMsg.includes('Error') ? 'text-ui-cta' : 'text-ev26-cyan'}`}>{saveMsg}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      {/* Enrollment */}
      {tournament && (
        <div className="bg-orion-surface rounded-xl p-5 border border-white/5">
          <h2 className="font-semibold text-ui-textMain mb-1">Quiniela {tournament.name}</h2>
          <p className="text-xs text-ui-textMuted mb-4">Costo: Q{tournament.entry_fee_gtq} · Registrate y espera confirmación de pago.</p>

          {isConfirmed && (
            <div className="flex items-center gap-2 text-sm text-ev26-cyan bg-ev26-cyan/10 border border-ev26-cyan/20 rounded-lg px-3 py-2">
              ✓ Inscripción confirmada
            </div>
          )}

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              ⏳ Pendiente de confirmación de pago
            </div>
          )}

          {!isEnrolled && tournament.status === 'registration' && (
            <form onSubmit={handleEnroll} className="space-y-3">
              {enrollMsg && <p className={`text-xs ${enrollMsg.includes('Error') || enrollMsg.includes('error') ? 'text-ui-cta' : 'text-ev26-cyan'}`}>{enrollMsg}</p>}
              <button
                type="submit"
                disabled={enrolling || !fullName}
                className="w-full bg-ev26-purple hover:bg-ev26-purple/90 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {enrolling ? 'Inscribiendo…' : 'Inscribirme en la quiniela'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Bonus predictions */}
      {isConfirmed && tournament && teams.length > 0 && (
        <div className="bg-orion-surface rounded-xl p-5 border border-white/5">
          <h2 className="font-semibold text-ui-textMain mb-1">Predicciones bonus</h2>
          <p className="text-xs text-ui-textMuted mb-4">10 pts por campeón correcto · 10 pts si predices ambos finalistas</p>
          <BonusPicker
            teams={teams}
            tournamentId={tournament.id}
            startsAt={tournament.starts_at}
            initialChampion={bonusPreds.champion}
            initialFinalist1={bonusPreds.finalist1}
            initialFinalist2={bonusPreds.finalist2}
          />
        </div>
      )}
    </div>
  )
}
