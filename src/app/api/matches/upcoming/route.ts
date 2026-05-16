import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') ?? '5')

  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      *,
      phase:phases(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('status', 'scheduled')
    .gte('kickoff_at', new Date().toISOString())
    .order('kickoff_at', { ascending: true })
    .limit(limit)

  if (error) return NextResponse.json({ error: 'Error fetching upcoming matches' }, { status: 500 })

  if (!matches?.length) return NextResponse.json({ matches: [] })

  const matchIds = matches.map((m) => m.id)
  const { data: predictions } = await supabase
    .from('predictions')
    .select('match_id, home_score, away_score')
    .eq('user_id', user.id)
    .in('match_id', matchIds)

  const predMap = new Map(predictions?.map((p) => [p.match_id, p]) ?? [])

  const enriched = matches.map((m) => ({ ...m, prediction: predMap.get(m.id) ?? null }))

  return NextResponse.json({ matches: enriched })
}
