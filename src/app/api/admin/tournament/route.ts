import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['registration', 'active', 'completed']).optional(),
  name:   z.string().min(2).optional(),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .eq('slug', 'quiniela')
    .single()

  if (!tournament) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })

  const { data: updated, error } = await supabase
    .from('tournaments')
    .update(parsed.data)
    .eq('id', tournament.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error updating tournament' }, { status: 500 })

  return NextResponse.json({ tournament: updated })
}
