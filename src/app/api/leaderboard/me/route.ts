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

  if (!tournament) return NextResponse.json({ entry: null })

  const { data: entry } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ entry: entry ?? null })
}
