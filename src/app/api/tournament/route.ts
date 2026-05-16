import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', 'quiniela')
    .single()

  if (error) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

  const { count: participantCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('tournament_id', tournament.id)
    .eq('payment_status', 'confirmed')

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('tournament_id', tournament.id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ tournament, participantCount, enrollment })
}
