import Image from 'next/image'
import Link from 'next/link'
import type { Video } from '@/lib/types'
import { getYouTubeThumbnail } from '@/lib/types'

interface VideoCardProps {
  video: Video
  showStatus?: boolean
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `hace ${days}d`
  const months = Math.floor(days / 30)
  return `hace ${months} mes${months > 1 ? 'es' : ''}`
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  published: 'Publicado',
  rejected: 'Rechazado',
}

export default function VideoCard({ video, showStatus = false }: VideoCardProps) {
  const thumbnail = video.thumbnail_url || getYouTubeThumbnail(video.video_url)

  return (
    <Link href={`/videos/${video.id}`} className="card-hover group block">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={thumbnail}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-xl">
            <svg className="w-6 h-6 text-drone-bg ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Region badge */}
        {video.region && (
          <div className="absolute bottom-2 left-2">
            <span className="glass text-xs font-medium text-white px-2 py-1 rounded-full">
              📍 {video.region.name}
            </span>
          </div>
        )}
        {/* Status badge */}
        {showStatus && (
          <div className="absolute top-2 right-2">
            <span className={`badge-${video.status}`}>
              {STATUS_LABELS[video.status]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white line-clamp-2 group-hover:text-sky-400 transition-colors leading-snug">
          {video.title}
        </h3>
        {video.profile && (
          <p className="text-slate-400 text-sm mt-1">{video.profile.name}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-slate-500 text-xs">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {formatCount(video.views_count)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {formatCount(video.likes_count)}
          </span>
          <span className="ml-auto">{timeAgo(video.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
