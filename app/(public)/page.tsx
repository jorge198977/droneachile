import Link from 'next/link'
import Image from 'next/image'
import VideoCard from '@/components/VideoCard'
import type { Video, Region } from '@/lib/types'

async function getVideos(sort = 'created_at'): Promise<Video[]> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}`
    : 'http://localhost:3000'

  try {
    const res = await fetch(`${base}/api/videos?pageSize=8&sort=${sort}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data ?? []
  } catch {
    return []
  }
}

async function getRegions(): Promise<Region[]> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${base}/api/regions`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const json = await res.json()
    return json.regions ?? []
  } catch {
    return []
  }
}

const REGION_ICONS: Record<string, string> = {
  'arica-y-parinacota': '🏜️',
  'tarapaca': '☀️',
  'antofagasta': '🌵',
  'atacama': '🌅',
  'coquimbo': '🍇',
  'valparaiso': '🏙️',
  'region-metropolitana': '🌆',
  'ohiggins': '🌾',
  'maule': '🍷',
  'nuble': '🏔️',
  'biobio': '🌊',
  'la-araucania': '🌲',
  'los-rios': '🦆',
  'los-lagos': '🏔️',
  'aysen': '❄️',
  'magallanes': '🧊',
}

export default async function HomePage() {
  const [latestVideos, trendingVideos, regions] = await Promise.all([
    getVideos('created_at'),
    getVideos('trending'),
    getRegions(),
  ])

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Gradient overlays to merge video with dark theme and ensure text readability */}
          <div className="absolute inset-0 bg-drone-bg/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-drone-bg/90 via-transparent to-drone-bg" />
        </div>

        {/* Animated orbs (reduced opacity) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse-slow z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow z-0" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-5xl mx-auto animate-slide-up pt-48 lg:pt-64">
          
          {/* No logo image, letting the background video's logo shine */}

          {/* Headline */}
          <h1 className="font-display font-black text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight drop-shadow-2xl">
            Chile desde
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">
              las alturas
            </span>
          </h1>

          <p className="text-slate-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow-lg font-medium">
            Descubre, comparte y vive Chile desde el aire. Videos aéreos de las 16 regiones,
            capturados por la comunidad de pilotos de drones más grande del país.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explorar" id="hero-explore-btn" className="btn-primary text-base px-8 py-4 shadow-xl shadow-sky-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorar videos
            </Link>
            <Link href="/auth/register" id="hero-join-btn" className="btn-secondary text-base px-8 py-4 shadow-xl backdrop-blur-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Subir mi video
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 justify-center mt-16 text-center drop-shadow-lg">
            {[
              { value: '16', label: 'Regiones' },
              { value: '100%', label: 'Contenido aéreo' },
              { value: '∞', label: 'Perspectivas' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold font-display text-sky-400">{stat.value}</div>
                <div className="text-white font-medium text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── TRENDING VIDEOS ── */}
      {trendingVideos.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-drone-gold text-lg">🔥</span>
                <span className="text-drone-gold text-sm font-medium uppercase tracking-wider">Trending</span>
              </div>
              <h2 className="section-title">Lo más popular</h2>
            </div>
            <Link href="/explorar?sort=trending" className="btn-ghost text-sm">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingVideos.slice(0, 4).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* ── EXPLORE BY REGION ── */}
      {regions.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-sky-400 uppercase tracking-wider font-medium">Destinos</span>
              </div>
              <h2 className="section-title">Explora por región</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
            {regions.map((region) => (
              <Link
                key={region.id}
                href={`/regiones/${region.slug}`}
                className="card-hover group p-4 text-center"
              >
                <div className="text-3xl mb-3">{REGION_ICONS[region.slug] ?? '📍'}</div>
                <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors leading-tight">
                  {region.name}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── LATEST VIDEOS ── */}
      {latestVideos.length > 0 && (
        <section className="section">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-sky-400 uppercase tracking-wider font-medium">Recientes</span>
              </div>
              <h2 className="section-title">Últimas subidas</h2>
            </div>
            <Link href="/explorar" className="btn-ghost text-sm">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="section">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600/20 to-blue-800/20 border border-sky-500/20 p-8 sm:p-12 text-center glow-blue">
          <div className="absolute inset-0 bg-glow-blue" />
          <div className="relative z-10">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
              ¿Tienes imágenes aéreas de Chile?
            </h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Comparte tu perspectiva con miles de personas. Únete a la comunidad de pilotos de drones.
            </p>
            <Link href="/auth/register" id="cta-join-btn" className="btn-primary text-base px-10 py-4">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
