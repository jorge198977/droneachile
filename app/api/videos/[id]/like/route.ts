import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('video_id', id)
    .single()

  if (existing) {
    // Unlike
    await supabase.from('likes').delete().eq('id', existing.id)
    return NextResponse.json({ liked: false, message: 'Like removido' })
  } else {
    // Like
    await supabase.from('likes').insert({ user_id: user.id, video_id: id })
    return NextResponse.json({ liked: true, message: 'Like agregado' })
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', id)

  let userLiked = false
  if (user) {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('video_id', id)
      .eq('user_id', user.id)
      .single()
    userLiked = !!data
  }

  return NextResponse.json({ count: count ?? 0, userLiked })
}
