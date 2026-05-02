import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'No autenticado', status: 401, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Solo admins', status: 403, user: null }
  return { error: null, status: 200, user }
}

// PATCH /api/videos/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const auth = await requireAdmin(supabase)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json().catch(() => ({}))
  const { action, reason } = body

  const newStatus = action === 'approve' ? 'published' : 'rejected'

  const { error: updateError } = await supabase
    .from('videos')
    .update({ status: newStatus })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  await supabase.from('moderation_logs').insert({
    video_id: id,
    admin_id: auth.user!.id,
    action: action === 'approve' ? 'approved' : 'rejected',
    reason: reason ?? null,
  })

  return NextResponse.json({ message: `Video ${newStatus}` })
}
