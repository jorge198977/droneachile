export type UserRole = 'admin' | 'creator' | 'user'
export type VideoStatus = 'pending' | 'published' | 'rejected'
export type VideoSource = 'youtube' | 'upload'
export type ModerationAction = 'approved' | 'rejected'

export interface Profile {
  id: string
  name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Region {
  id: number
  name: string
  slug: string
}

export interface Category {
  id: number
  name: string
}

export interface Video {
  id: string
  title: string
  description: string | null
  video_url: string
  thumbnail_url: string | null
  source: VideoSource
  region_id: number | null
  user_id: string
  status: VideoStatus
  views_count: number
  likes_count: number
  created_at: string
  // Joins
  region?: Region
  profile?: Profile
  categories?: Category[]
  user_liked?: boolean
}

export interface Like {
  id: string
  user_id: string
  video_id: string
}

export interface Comment {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  profile?: Profile
}

export interface View {
  id: string
  video_id: string
  user_id: string | null
  created_at: string
}

export interface ModerationLog {
  id: string
  video_id: string
  admin_id: string
  action: ModerationAction
  reason: string | null
  created_at: string
  profile?: Profile
  video?: Video
}

// API response helpers
export interface ApiResponse<T> {
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// YouTube helpers
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export function getYouTubeThumbnail(videoUrl: string): string {
  const id = getYouTubeId(videoUrl)
  if (!id) return '/placeholder-video.jpg'
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
}

export function getYouTubeEmbed(videoUrl: string): string {
  const id = getYouTubeId(videoUrl)
  if (!id) return ''
  return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
}
