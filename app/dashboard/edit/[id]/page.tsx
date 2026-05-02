'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Region, Category } from '@/lib/types'
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/types'

export default function EditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [regions, setRegions] = useState<Region[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [preview, setPreview] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    video_url: '',
    region_id: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/regions').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch(`/api/videos/${id}`).then(r => r.json())
    ]).then(([regionsData, categoriesData, videoData]) => {
      setRegions(regionsData.regions ?? [])
      setCategories(categoriesData.categories ?? [])
      
      if (videoData.video) {
        const v = videoData.video
        setForm({
          title: v.title || '',
          description: v.description || '',
          video_url: v.video_url || '',
          region_id: v.region_id?.toString() || '',
        })
        if (v.video_url) {
          setPreview(getYouTubeThumbnail(v.video_url))
        }
        if (v.categories) {
          setSelectedCategories(v.categories.map((c: any) => c.id))
        }
      }
      setLoading(false)
    }).catch(() => {
      setError('Error al cargar los datos del video')
      setLoading(false)
    })
  }, [id])

  const toggleCategory = (catId: number) => {
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch(`/api/videos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        region_id: form.region_id ? parseInt(form.region_id) : null,
        category_ids: selectedCategories,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al guardar los cambios')
      setSaving(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white">Editar video</h1>
        <p className="text-slate-400 mt-1">Actualiza la información de tu video</p>
      </div>

      {success ? (
        <div className="card p-10 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Cambios guardados!</h2>
          <p className="text-slate-400">Volviendo a tu dashboard...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* YouTube URL (Read-only) */}
          <div>
            <label className="label">URL de YouTube</label>
            <input
              type="url"
              readOnly
              disabled
              value={form.video_url}
              className="input opacity-50 cursor-not-allowed"
            />
          </div>

          {/* Thumbnail preview */}
          {preview && (
            <div className="rounded-xl overflow-hidden border border-drone-border opacity-70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="video-title" className="label">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              id="video-title"
              type="text"
              required
              maxLength={120}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="video-description" className="label">Descripción</label>
            <textarea
              id="video-description"
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input resize-none"
            />
          </div>

          {/* Region */}
          <div>
            <label htmlFor="video-region" className="label">
              Región <span className="text-red-400">*</span>
            </label>
            <select
              id="video-region"
              required
              value={form.region_id}
              onChange={e => setForm(f => ({ ...f, region_id: e.target.value }))}
              className="input"
            >
              <option value="">Seleccionar región...</option>
              {regions.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <label className="label">Categorías</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      selectedCategories.includes(cat.id)
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                        : 'border-drone-border text-slate-400 hover:border-sky-500/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={saving}
              className="btn-ghost sm:w-1/3 justify-center py-3 border border-drone-border hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary sm:flex-1 justify-center py-3 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
