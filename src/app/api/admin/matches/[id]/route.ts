import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateMatchSchema = z.object({
  homeScoreResult: z.number().int().min(0).max(99).optional(),
  awayScoreResult: z.number().int().min(0).max(99).optional(),
  homeScorePen:    z.number().int().min(0).max(99).optional(),
  awayScorePen:    z.number().int().min(0).max(99).optional(),
  status:          z.enum(['scheduled', 'live', 'half_time', 'completed', 'postponed', 'cancelled']).optional(),
  homeTeamId:      z.string().uuid().optional(),
  awayTeamId:      z.string().uuid().optional(),
  kickoffAt:       z.string().datetime().optional(),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = updateMatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  const { homeScoreResult, awayScoreResult, homeScorePen, awayScorePen, status, homeTeamId, awayTeamId, kickoffAt } = parsed.data

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (homeScoreResult !== undefined) update.home_score_result = homeScoreResult
  if (awayScoreResult !== undefined) update.away_score_result = awayScoreResult
  if (homeScorePen    !== undefined) update.home_score_pen    = homeScorePen
  if (awayScorePen    !== undefined) update.away_score_pen    = awayScorePen
  if (status          !== undefined) update.status            = status
  if (homeTeamId      !== undefined) update.home_team_id      = homeTeamId
  if (awayTeamId      !== undefined) update.away_team_id      = awayTeamId
  if (kickoffAt       !== undefined) update.kickoff_at        = kickoffAt

  const { data: match, error } = await supabase
    .from('matches')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error updating match' }, { status: 500 })

  // If marking as completed with scores, trigger scoring pipeline
  if (status === 'completed' && homeScoreResult !== undefined && awayScoreResult !== undefined) {
    const { error: scoreError } = await supabase.rpc('compute_match_scores', { p_match_id: id })

    if (scoreError) {
      console.error('Scoring pipeline error:', scoreError)
    }

    await supabase.from('notifications').insert({
      channel:    'admin',
      event_type: 'admin_score_override',
      payload:    {
        match_id:          id,
        home_score_result: homeScoreResult,
        away_score_result: awayScoreResult,
        set_by:            admin.id,
      },
    })
  }

  return NextResponse.json({ match })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Error deleting match' }, { status: 500 })

  return NextResponse.json({ success: true })
}
