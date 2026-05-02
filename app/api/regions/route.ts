import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: regions, error } = await supabase
    .from('regions')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ regions: regions ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo admins' }, { status: 403 })
  }

  const { name, slug } = await request.json()
  if (!name || !slug) {
    return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
  }

  const { data: region, error } = await supabase
    .from('regions')
    .insert({ name, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ region }, { status: 201 })
}
