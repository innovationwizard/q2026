import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const teamSchema = z.object({
  name:        z.string().min(2).max(100).trim(),
  code:        z.string().length(3).toUpperCase(),
  groupLetter: z.string().length(1).toUpperCase().optional(),
  ranking:     z.number().int().positive().optional(),
  flagUrl:     z.string().url().optional(),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: teams, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error fetching teams' }, { status: 500 })

  return NextResponse.json({ teams: teams ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = teamSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  const { name, code, groupLetter, ranking, flagUrl } = parsed.data

  const { data: team, error } = await supabase
    .from('teams')
    .insert({
      name,
      code,
      group_letter: groupLetter ?? null,
      ranking:      ranking ?? null,
      flag_url:     flagUrl ?? null,
    })
    .select()
    .single()

  if (error?.code === '23505') return NextResponse.json({ error: `El código de equipo "${code}" ya existe` }, { status: 409 })
  if (error) return NextResponse.json({ error: 'Error creating team' }, { status: 500 })

  return NextResponse.json({ team }, { status: 201 })
}
