import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const predictionSchema = z.object({
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const parsed = predictionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Marcador inválido' }, { status: 400 })

  const { homeScore, awayScore } = parsed.data

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('payment_status', 'confirmed')
    .single()

  if (!enrollment) return NextResponse.json({ error: 'Debes tener el pago confirmado para predecir' }, { status: 403 })

  const { data: match } = await supabase
    .from('matches')
    .select('id, status, prediction_cutoff_at')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
  if (match.status !== 'scheduled') return NextResponse.json({ error: 'El partido ya inició o finalizó' }, { status: 409 })
  if (new Date() >= new Date(match.prediction_cutoff_at)) {
    return NextResponse.json({ error: 'El tiempo para predecir este partido ha cerrado' }, { status: 409 })
  }

  const { data: prediction, error } = await supabase
    .from('predictions')
    .upsert(
      { user_id: user.id, match_id: matchId, home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al guardar predicción' }, { status: 500 })

  return NextResponse.json({ prediction })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: prediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', matchId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ prediction: prediction ?? null })
}
