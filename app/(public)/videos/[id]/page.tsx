'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getYouTubeEmbed, getYouTubeThumbnail } from '@/lib/types'
import type { Video, Comment, Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

export default function VideoDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [user, setUser] = useState<Profile | null>(null)
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        supabase.from('profiles').select('*').eq('id', authUser.id).single()
          .then(({ data }) => setUser(data))
      }
    })
  }, [])

  useEffect(() => {
    if (!id) return

    Promise.all([
      fetch(`/api/videos/${id}`).then(r => r.json()),
      fetch(`/api/videos/${id}/comments`).then(r => r.json()),
      fetch(`/api/videos/${id}/like`).then(r => r.json()),
      fetch('/api/videos?pageSize=5').then(r => r.json()),
    ]).then(([vData, cData, lData, rData]) => {
      if (vData.video) setVideo(vData.video)
      if (rData?.data) setRelatedVideos(rData.data.filter((v: Video) => v.id !== id).slice(0, 4))
      setComments(cData.comments ?? [])
      setLiked(lData.userLiked ?? false)
      setLikesCount(lData.count ?? 0)
      setLoading(false)

      // Register view
      fetch(`/api/videos/${id}/view`, { method: 'POST' })
    })
  }, [id])

  const handleLike = async () => {
    if (!user) { router.push('/auth/login'); return }
    const res = await fetch(`/api/videos/${id}/like`, { method: 'POST' })
    const data = await res.json()
    setLiked(data.liked)
    setLikesCount(prev => data.liked ? prev + 1 : prev - 1)
  }

  const handleComment = async () => {
    if (!user) { router.push('/auth/login'); return }
    if (!newComment.trim()) return
    setCommentLoading(true)

    const res = await fetch(`/api/videos/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    })
    const data = await res.json()
    if (data.comment) {
      setComments(prev => [data.comment, ...prev])
      setNewComment('')
    }
    setCommentLoading(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">🚁</div>
        <h1 className="text-2xl font-bold text-white">Video no encontrado</h1>
        <Link href="/explorar" className="btn-primary">Explorar videos</Link>
      </div>
    )
  }

  const embedUrl = getYouTubeEmbed(video.video_url)
  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.video_url)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video player */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-black">
              {playing && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={video.title}
                />
              ) : (
                <div className="relative w-full h-full cursor-pointer group" onClick={() => setPlaying(true)}>
                  <Image
                    src={thumbnail}
                    alt={video.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-drone-bg ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video info */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display font-bold text-2xl text-white leading-tight flex-1">
                {video.title}
              </h1>
              <button
                id="like-btn"
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                  liked
                    ? 'bg-red-500/20 border-red-500/40 text-red-400'
                    : 'border-drone-border text-slate-400 hover:border-red-500/40 hover:text-red-400'
                }`}
              >
                <svg className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium">{likesCount}</span>
              </button>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              {video.profile && (
                <Link href={`/usuarios/${video.profile.id}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                    {video.profile.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  {video.profile.name}
                </Link>
              )}
              {video.region && (
                <span className="flex items-center gap-1">
                  📍 {video.region.name}
                </span>
              )}
              <span>{video.views_count} visualizaciones</span>
              <span>{new Date(video.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            {/* Tags / Categories */}
            {video.categories && video.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {video.categories.map((cat: {id: number, name: string}) => (
                  <Link key={cat.id} href={`/explorar`} className="px-2.5 py-1 rounded-md text-xs font-medium bg-drone-border/50 text-slate-300 border border-drone-border hover:bg-sky-500/10 hover:text-sky-400 hover:border-sky-500/30 transition-colors">
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {video.description && (
              <p className="text-slate-300 leading-relaxed border-t border-drone-border pt-4">
                {video.description}
              </p>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-4">
            <h2 className="font-semibold text-white text-lg">
              Comentarios ({comments.length})
            </h2>

            {/* Comment input */}
            {user ? (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    id="comment-input"
                    type="text"
                    placeholder="Escribe un comentario..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    className="input flex-1"
                  />
                  <button
                    id="submit-comment-btn"
                    onClick={handleComment}
                    disabled={commentLoading || !newComment.trim()}
                    className="btn-primary py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {commentLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                <Link href="/auth/login" className="text-sky-400 hover:underline">Inicia sesión</Link> para comentar
              </p>
            )}

            {/* Comment list */}
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {comment.profile?.name?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{comment.profile?.name ?? 'Usuario'}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{comment.content}</p>
                  </div>
                  {(user?.id === comment.user_id || user?.role === 'admin') && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider text-slate-400">
            Más videos
          </h3>
          <div className="space-y-3">
            {relatedVideos.map(rv => (
              <Link key={rv.id} href={`/videos/${rv.id}`} className="card p-0 flex gap-3 overflow-hidden hover:bg-white/5 transition-colors group">
                <div className="relative w-32 h-20 flex-shrink-0">
                  <Image src={rv.thumbnail_url || getYouTubeThumbnail(rv.video_url)} alt={rv.title} fill className="object-cover" />
                </div>
                <div className="p-2 flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-sky-400 transition-colors leading-snug">{rv.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{rv.views_count} visualizaciones</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
