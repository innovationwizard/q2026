import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createMatchSchema = z.object({
  phaseId:             z.string().uuid(),
  homeTeamId:          z.string().uuid().optional(),
  awayTeamId:          z.string().uuid().optional(),
  homeTeamPlaceholder: z.string().max(100).optional(),
  awayTeamPlaceholder: z.string().max(100).optional(),
  kickoffAt:           z.string().datetime(),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = createMatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  const { phaseId, homeTeamId, awayTeamId, homeTeamPlaceholder, awayTeamPlaceholder, kickoffAt } = parsed.data

  const { data: match, error } = await supabase
    .from('matches')
    .insert({
      phase_id:              phaseId,
      home_team_id:          homeTeamId ?? null,
      away_team_id:          awayTeamId ?? null,
      home_team_placeholder: homeTeamPlaceholder ?? null,
      away_team_placeholder: awayTeamPlaceholder ?? null,
      kickoff_at:            kickoffAt,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error creating match' }, { status: 500 })

  return NextResponse.json({ match }, { status: 201 })
}
