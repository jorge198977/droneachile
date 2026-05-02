import VideoCard from '@/components/VideoCard'
import type { Video, Region } from '@/lib/types'
import Link from 'next/link'

async function getRegion(slug: string): Promise<Region | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/regions`, { next: { revalidate: 3600 } })
  const data = await res.json()
  return (data.regions ?? []).find((r: Region) => r.slug === slug) ?? null
}

async function getVideosByRegion(regionId: number): Promise<Video[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/videos?region=${regionId}&pageSize=20`, {
    next: { revalidate: 60 },
  })
  const data = await res.json()
  return data.data ?? []
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const region = await getRegion(slug)

  if (!region) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📍</div>
        <h1 className="text-2xl font-bold text-white">Región no encontrada</h1>
        <Link href="/" className="btn-primary">Ir al inicio</Link>
      </div>
    )
  }

  const videos = await getVideosByRegion(region.id)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-drone-border bg-drone-surface py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>·</span>
            <span className="text-white">{region.name}</span>
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-2">
            📍 {region.name}
          </h1>
          <p className="text-slate-400">
            {videos.length} video{videos.length !== 1 ? 's' : ''} de esta región
          </p>
        </div>
      </div>

      <div className="section">
        {videos.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🚁</div>
            <h2 className="text-xl font-semibold text-white mb-2">Aún no hay videos</h2>
            <p className="text-slate-400 mb-6">Sé el primero en subir un video de {region.name}</p>
            <Link href="/dashboard/upload" className="btn-primary">Subir video</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
