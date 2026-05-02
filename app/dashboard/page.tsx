'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import VideoCard from '@/components/VideoCard'
import type { Video, Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'pending' | 'rejected'>('all')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      const { data: videosData } = await supabase
        .from('videos')
        .select('*, region:regions(id, name, slug), profile:profiles(id, name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setVideos(videosData ?? [])
      setLoading(false)
    })
  }, [])

  const handleDelete = async (videoId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.')) return

    const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
    if (res.ok) {
      setVideos(prev => prev.filter(v => v.id !== videoId))
    } else {
      const data = await res.json()
      alert(data.error || 'Error al eliminar el video')
    }
  }

  const filtered = filter === 'all' ? videos : videos.filter(v => v.status === filter)

  const stats = {
    total: videos.length,
    published: videos.filter(v => v.status === 'published').length,
    pending: videos.filter(v => v.status === 'pending').length,
    rejected: videos.filter(v => v.status === 'rejected').length,
    views: videos.reduce((a, v) => a + v.views_count, 0),
    likes: videos.reduce((a, v) => a + v.likes_count, 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white">
            Hola, {profile?.name?.split(' ')[0] ?? 'piloto'} 👋
          </h1>
          <p className="text-slate-400 mt-1">Gestiona tus videos aéreos</p>
        </div>
        <Link href="/dashboard/upload" id="upload-btn" className="btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Subir video
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Videos', value: stats.total, icon: '🎥' },
          { label: 'Publicados', value: stats.published, icon: '✅' },
          { label: 'Visualizaciones', value: stats.views.toLocaleString(), icon: '👁️' },
          { label: 'Likes', value: stats.likes.toLocaleString(), icon: '❤️' },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold font-display text-white">{stat.value}</div>
            <div className="text-slate-400 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'published', 'pending', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'border border-drone-border text-slate-400 hover:text-white'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'published' ? 'Publicados' : f === 'pending' ? 'Pendientes' : 'Rechazados'}
            {f !== 'all' && <span className="ml-2 text-xs">({stats[f] ?? 0})</span>}
          </button>
        ))}
      </div>

      {/* Video grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-6xl mb-4">🚁</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {filter === 'all' ? 'Aún no has subido videos' : `No tienes videos ${filter}`}
          </h2>
          {filter === 'all' && (
            <Link href="/dashboard/upload" className="btn-primary mt-4">
              Subir mi primer video
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(video => (
            <div key={video.id} className="relative group">
              <VideoCard video={video} showStatus />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDelete(video.id)
                }}
                className="absolute top-2 left-2 p-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg border border-red-400/50"
                title="Eliminar video"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
