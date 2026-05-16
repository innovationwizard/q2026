import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bonusSchema = z.object({
  tournamentId:   z.string().uuid(),
  champion:       z.string().uuid(),
  finalist1:      z.string().uuid(),
  finalist2:      z.string().uuid(),
})

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tournamentId = searchParams.get('tournament')
  if (!tournamentId) return NextResponse.json({ error: 'tournament required' }, { status: 400 })

  const { data: bonusPredictions } = await supabase
    .from('bonus_predictions')
    .select('*, team:teams(*)')
    .eq('user_id', user.id)
    .eq('tournament_id', tournamentId)

  return NextResponse.json({ bonusPredictions: bonusPredictions ?? [] })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = bonusSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { tournamentId, champion, finalist1, finalist2 } = parsed.data

  if (finalist1 === finalist2) {
    return NextResponse.json({ error: 'Los dos finalistas deben ser equipos diferentes' }, { status: 400 })
  }

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('starts_at')
    .eq('id', tournamentId)
    .single()

  if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  if (new Date() >= new Date(tournament.starts_at)) {
    return NextResponse.json({ error: 'El plazo para predicciones bonus ya cerró' }, { status: 409 })
  }

  const upserts = [
    { user_id: user.id, tournament_id: tournamentId, prediction_type: 'champion'    as const, team_id: champion   },
    { user_id: user.id, tournament_id: tournamentId, prediction_type: 'finalist_1'  as const, team_id: finalist1  },
    { user_id: user.id, tournament_id: tournamentId, prediction_type: 'finalist_2'  as const, team_id: finalist2  },
  ]

  const { error } = await supabase
    .from('bonus_predictions')
    .upsert(upserts, { onConflict: 'user_id,tournament_id,prediction_type' })

  if (error) return NextResponse.json({ error: 'Error al guardar predicciones bonus' }, { status: 500 })

  return NextResponse.json({ success: true })
}
