import { createClient } from '@/lib/supabase/server'
import { getYouTubeThumbnail } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()

  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      region:regions(id, name, slug),
      profile:profiles(id, name, avatar_url),
      video_categories(category_id, categories(id, name))
    `)
    .eq('id', id)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: 'Video no encontrado' }, { status: 404 })
  }

  const enriched = {
    ...video,
    thumbnail_url: video.thumbnail_url || getYouTubeThumbnail(video.video_url),
    categories: (video.video_categories ?? []).map((vc: { categories: { id: number; name: string } }) => vc.categories),
  }

  return NextResponse.json({ video: enriched })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Check ownership or admin
  const { data: video } = await supabase
    .from('videos')
    .select('user_id')
    .eq('id', id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (video?.user_id !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, region_id, category_ids } = body

  const { data: updated, error } = await supabase
    .from('videos')
    .update({ title, description, region_id })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (category_ids !== undefined) {
    await supabase.from('video_categories').delete().eq('video_id', id)
    if (category_ids.length > 0) {
      const categoryRows = category_ids.map((cid: number) => ({
        video_id: id,
        category_id: cid,
      }))
      await supabase.from('video_categories').insert(categoryRows)
    }
  }

  return NextResponse.json({ video: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: video } = await supabase
    .from('videos')
    .select('user_id')
    .eq('id', id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (video?.user_id !== user.id && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { error } = await supabase.from('videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ message: 'Video eliminado' })
}
