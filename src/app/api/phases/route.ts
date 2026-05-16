import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: phases, error } = await supabase
    .from('phases')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error fetching phases' }, { status: 500 })

  return NextResponse.json({ phases: phases ?? [] })
}
