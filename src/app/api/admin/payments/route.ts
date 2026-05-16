import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', 'quiniela')
    .single()

  if (!tournament) return NextResponse.json({ enrollments: [] })

  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      *,
      user:users(id, email, full_name, phone)
    `)
    .eq('tournament_id', tournament.id)
    .order('registered_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error fetching enrollments' }, { status: 500 })

  return NextResponse.json({ enrollments: enrollments ?? [] })
}
