'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Video } from '@/lib/types'
import { getYouTubeThumbnail } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'published' | 'rejected'>('pending')
  const [reason, setReason] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('videos')
      .select('*, region:regions(id, name, slug), profile:profiles(id, name, avatar_url)')
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVideos(data ?? [])
        setLoading(false)
      })
  }, [filter])

  const handleModerate = async (videoId: string, action: 'approve' | 'reject') => {
    setActionLoading(videoId)
    const res = await fetch(`/api/videos/${videoId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: reason[videoId] ?? null }),
    })

    if (res.ok) {
      setVideos(prev => prev.filter(v => v.id !== videoId))
    }
    setActionLoading(null)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-3xl text-white">Moderación de Videos</h1>
        <p className="text-slate-400 mt-1">Revisa y aprueba el contenido de la plataforma</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'published', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true) }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === f
                ? f === 'pending'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : f === 'published'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
                : 'border-drone-border text-slate-400 hover:text-white'
            }`}
          >
            {f === 'pending' ? '⏳ Pendientes' : f === 'published' ? '✅ Publicados' : '❌ Rechazados'}
          </button>
        ))}
      </div>

      {/* Video list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-4">✨</div>
          <h2 className="text-xl font-semibold text-white">
            No hay videos {filter === 'pending' ? 'pendientes' : filter === 'published' ? 'publicados' : 'rechazados'}
          </h2>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map(video => {
            const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.video_url)
            return (
              <div key={video.id} className="card p-4 flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 aspect-video flex-shrink-0 rounded-xl overflow-hidden">
                  <Image src={thumbnail} alt={video.title} fill className="object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Link href={`/videos/${video.id}`} target="_blank" className="font-semibold text-white hover:text-sky-400 transition-colors line-clamp-2">
                    {video.title}
                  </Link>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>👤 {video.profile?.name ?? 'Unknown'}</span>
                    {video.region && <span>📍 {video.region.name}</span>}
                    <span>📅 {new Date(video.created_at).toLocaleDateString('es-CL')}</span>
                    <span>👁️ {video.views_count} vistas</span>
                  </div>
                  {video.description && (
                    <p className="text-slate-400 text-sm line-clamp-2">{video.description}</p>
                  )}

                  {/* Moderation actions */}
                  {filter === 'pending' && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Motivo (opcional para rechazo)"
                        value={reason[video.id] ?? ''}
                        onChange={e => setReason(r => ({ ...r, [video.id]: e.target.value }))}
                        className="input text-sm py-2 flex-1"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModerate(video.id, 'approve')}
                          disabled={actionLoading === video.id}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {actionLoading === video.id ? '...' : '✅ Aprobar'}
                        </button>
                        <button
                          onClick={() => handleModerate(video.id, 'reject')}
                          disabled={actionLoading === video.id}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {actionLoading === video.id ? '...' : '❌ Rechazar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
