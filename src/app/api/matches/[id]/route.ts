import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: match, error } = await supabase
    .from('matches')
    .select(`
      *,
      phase:phases(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error || !match) return NextResponse.json({ error: 'Match not found' }, { status: 404 })

  const { data: prediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('match_id', id)
    .eq('user_id', user.id)
    .single()

  const { data: score } = await supabase
    .from('match_scores')
    .select('*')
    .eq('match_id', id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ match, prediction: prediction ?? null, score: score ?? null })
}
