import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const actionSchema = z.object({
  action: z.enum(['confirm', 'refund']),
})

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = actionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  const { action } = parsed.data

  if (action === 'confirm') {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({
        payment_status:       'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: admin.id,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Error confirming payment' }, { status: 500 })

    // Add user to leaderboard via recompute
    await supabase.rpc('recompute_leaderboard')

    await supabase.from('notifications').insert({
      user_id:    enrollment.user_id,
      channel:    'admin',
      event_type: 'payment_confirmed',
      payload:    { enrollment_id: id, confirmed_by: admin.id },
    })

    return NextResponse.json({ enrollment })
  }

  if (action === 'refund') {
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({
        payment_status: 'refunded',
        refunded_at:    new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Error processing refund' }, { status: 500 })

    // Remove from leaderboard
    await supabase
      .from('leaderboard')
      .delete()
      .eq('user_id', enrollment.user_id)

    await supabase.from('notifications').insert({
      user_id:    enrollment.user_id,
      channel:    'admin',
      event_type: 'payment_refunded',
      payload:    { enrollment_id: id, refunded_by: admin.id },
    })

    return NextResponse.json({ enrollment })
  }
}
