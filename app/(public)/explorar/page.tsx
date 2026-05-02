'use client'

import { useState, useEffect, useCallback } from 'react'
import VideoCard from '@/components/VideoCard'
import type { Video, Region, Category } from '@/lib/types'

export default function ExplorarPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  const [search, setSearch] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedSort, setSelectedSort] = useState('created_at')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const fetchVideos = useCallback(async (reset = false) => {
    setLoading(true)
    const currentPage = reset ? 1 : page
    const params = new URLSearchParams({
      page: currentPage.toString(),
      pageSize: '12',
      sort: selectedSort,
    })
    if (search) params.set('search', search)
    if (selectedRegion) params.set('region', selectedRegion)
    if (selectedCategory) params.set('category', selectedCategory)

    try {
      const res = await fetch(`/api/videos?${params}`)
      const data = await res.json()
      if (reset) {
        setVideos(data.data ?? [])
        setPage(1)
      } else {
        setVideos(prev => [...prev, ...(data.data ?? [])])
      }
      setTotal(data.total ?? 0)
    } catch {
      console.error('Error fetching videos')
    } finally {
      setLoading(false)
    }
  }, [page, search, selectedRegion, selectedSort, selectedCategory])

  useEffect(() => {
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d.regions ?? []))
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
  }, [])

  useEffect(() => {
    fetchVideos(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedRegion, selectedSort, selectedCategory])

  const loadMore = () => {
    setPage(p => p + 1)
  }

  useEffect(() => {
    if (page > 1) fetchVideos(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative border-b border-drone-border bg-drone-surface py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-display font-bold text-4xl text-white mb-2">Explorar</h1>
          <p className="text-slate-400">Descubre videos aéreos de todo Chile</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search-input"
              type="text"
              placeholder="Buscar videos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Region filter */}
          <select
            id="region-filter"
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="input md:w-52"
          >
            <option value="">Todas las regiones</option>
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            id="sort-filter"
            value={selectedSort}
            onChange={e => setSelectedSort(e.target.value)}
            className="input md:w-44"
          >
            <option value="created_at">Más recientes</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        {/* Categories chips */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.id.toString() ? '' : cat.id.toString())}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedCategory === cat.id.toString()
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'border-drone-border text-slate-400 hover:text-white hover:border-sky-500/50 hover:bg-sky-500/10'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <p className="text-slate-500 text-sm mb-6">
          {loading ? 'Cargando...' : `${total} videos encontrados`}
        </p>

        {/* Grid */}
        {loading && videos.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-video bg-drone-border" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-drone-border rounded w-3/4" />
                  <div className="h-3 bg-drone-border rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🚁</div>
            <h3 className="text-xl font-semibold text-white mb-2">No hay videos</h3>
            <p className="text-slate-400">Intenta con otros filtros o sé el primero en subir uno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {/* Load more */}
        {!loading && videos.length < total && (
          <div className="text-center mt-10">
            <button onClick={loadMore} className="btn-secondary">
              Cargar más videos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
