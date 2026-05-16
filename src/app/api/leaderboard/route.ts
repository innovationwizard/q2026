import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', 'quiniela')
    .single()

  if (!tournament) return NextResponse.json({ entries: [] })

  const { data: entries, error } = await supabase
    .from('leaderboard')
    .select(`
      *,
      user:users(id, full_name, avatar_url)
    `)
    .eq('tournament_id', tournament.id)
    .order('rank', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: 'Error fetching leaderboard' }, { status: 500 })

  return NextResponse.json({ entries: entries ?? [] })
}
