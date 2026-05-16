import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const enrollSchema = z.object({
  tournamentId: z.string().uuid(),
  fullName:     z.string().min(2).max(100).trim(),
  phone:        z.string().max(20).optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = enrollSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  const { tournamentId, fullName, phone } = parsed.data

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, status, registration_deadline')
    .eq('id', tournamentId)
    .single()

  if (!tournament) return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
  if (tournament.status !== 'registration') return NextResponse.json({ error: 'El registro está cerrado' }, { status: 409 })
  if (new Date() > new Date(tournament.registration_deadline)) {
    return NextResponse.json({ error: 'El plazo de registro ha vencido' }, { status: 409 })
  }

  const { data: existing } = await supabase
    .from('enrollments')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('user_id', user.id)
    .single()

  if (existing) return NextResponse.json({ error: 'Ya estás registrado en este torneo' }, { status: 409 })

  await supabase.from('users').update({ full_name: fullName, phone: phone ?? null }).eq('id', user.id)

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .insert({ user_id: user.id, tournament_id: tournamentId })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al registrarse' }, { status: 500 })

  return NextResponse.json({ enrollment }, { status: 201 })
}
