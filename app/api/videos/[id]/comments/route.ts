import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from('comments')
    .select(`
      *,
      profile:profiles(id, name, avatar_url)
    `)
    .eq('video_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comments: comments ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { content } = await request.json()
  if (!content?.trim()) {
    return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 })
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ user_id: user.id, video_id: id, content: content.trim() })
    .select(`*, profile:profiles(id, name, avatar_url)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ comment }, { status: 201 })
}
