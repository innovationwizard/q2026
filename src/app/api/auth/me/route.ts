import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ user: profile })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { fullName, phone } = body

  const update: Record<string, string | null> = {}
  if (typeof fullName === 'string' && fullName.trim().length >= 2) update.full_name = fullName.trim()
  if (typeof phone === 'string') update.phone = phone.trim() || null

  if (!Object.keys(update).length) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

  const { data: profile, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })

  return NextResponse.json({ user: profile })
}
