import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const phaseId = searchParams.get('phase')

  let query = supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (phaseId) {
    const { data: matchIds } = await supabase
      .from('matches')
      .select('id')
      .eq('phase_id', phaseId)

    if (matchIds?.length) {
      query = query.in('match_id', matchIds.map((m) => m.id))
    }
  }

  const { data: predictions, error } = await query
  if (error) return NextResponse.json({ error: 'Error fetching predictions' }, { status: 500 })

  return NextResponse.json({ predictions })
}
