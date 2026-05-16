import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const phase  = searchParams.get('phase')
  const status = searchParams.get('status')

  let query = supabase
    .from('matches')
    .select(`
      *,
      phase:phases(*),
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .order('kickoff_at', { ascending: true })

  if (phase)  query = query.eq('phase_id', phase)
  if (status) query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: 'Error fetching matches' }, { status: 500 })

  return NextResponse.json({ matches: data })
}
