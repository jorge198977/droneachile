import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, name, avatar_url, role, created_at')
    .eq('id', id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Get user's published videos
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url, views_count, likes_count, created_at')
    .eq('user_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(12)

  return NextResponse.json({ profile, videos: videos ?? [] })
}
