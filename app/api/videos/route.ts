import { createClient } from '@/lib/supabase/server'
import { getYouTubeThumbnail } from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = parseInt(searchParams.get('pageSize') ?? '12')
  const region = searchParams.get('region')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const status = searchParams.get('status') ?? 'published'
  const sort = searchParams.get('sort') ?? 'created_at'

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let selectQuery = `
    *,
    region:regions(id, name, slug),
    profile:profiles(id, name, avatar_url)
  `

  if (category) {
    selectQuery += `, video_categories!inner(category_id)`
  }

  let query = supabase
    .from('videos')
    .select(selectQuery, { count: 'exact' })
    .eq('status', status)
    .range(from, to)

  if (region) query = query.eq('region_id', region)
  if (search) query = query.ilike('title', `%${search}%`)
  if (category) query = query.eq('video_categories.category_id', category)

  if (sort === 'trending') {
    // score = views * 0.5 + likes * 2
    query = query.order('likes_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: videos, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Auto-fill thumbnails from YouTube
  const enriched = ((videos as any[]) ?? []).map((v: any) => ({
    ...v,
    thumbnail_url: v.thumbnail_url || getYouTubeThumbnail(v.video_url),
  }))

  return NextResponse.json({
    data: enriched,
    total: count ?? 0,
    page,
    pageSize,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, video_url, region_id, category_ids } = body

  if (!title || !video_url) {
    return NextResponse.json({ error: 'Título y URL del video son requeridos' }, { status: 400 })
  }

  // Auto-generate thumbnail from YouTube URL
  const thumbnail_url = getYouTubeThumbnail(video_url)

  const { data: video, error } = await supabase
    .from('videos')
    .insert({
      title,
      description,
      video_url,
      thumbnail_url,
      region_id: region_id || null,
      user_id: user.id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Assign categories if provided
  if (category_ids && category_ids.length > 0) {
    const categoryRows = category_ids.map((cid: number) => ({
      video_id: video.id,
      category_id: cid,
    }))
    await supabase.from('video_categories').insert(categoryRows)
  }

  return NextResponse.json({ video }, { status: 201 })
}
