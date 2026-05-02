'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Region, Category } from '@/lib/types'
import { getYouTubeId, getYouTubeThumbnail } from '@/lib/types'

export default function UploadPage() {
  const router = useRouter()
  const [regions, setRegions] = useState<Region[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
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
    fetch('/api/regions').then(r => r.json()).then(d => setRegions(d.regions ?? []))
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []))
  }, [])

  const handleUrlChange = (url: string) => {
    setForm(f => ({ ...f, video_url: url }))
    const id = getYouTubeId(url)
    if (id) {
      setPreview(getYouTubeThumbnail(url))
    } else {
      setPreview('')
    }
  }

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!getYouTubeId(form.video_url)) {
      setError('Ingresa una URL de YouTube válida')
      setLoading(false)
      return
    }

    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        region_id: form.region_id ? parseInt(form.region_id) : null,
        category_ids: selectedCategories,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al subir el video')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-white">Subir video</h1>
        <p className="text-slate-400 mt-1">Comparte tus imágenes aéreas de Chile</p>
      </div>

      {success ? (
        <div className="card p-10 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Video enviado!</h2>
          <p className="text-slate-400">Tu video está en revisión. Lo publicaremos pronto.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* YouTube URL */}
          <div>
            <label htmlFor="video-url" className="label">
              URL de YouTube <span className="text-red-400">*</span>
            </label>
            <input
              id="video-url"
              type="url"
              required
              value={form.video_url}
              onChange={e => handleUrlChange(e.target.value)}
              className="input"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Pega la URL del video de YouTube que quieres compartir
            </p>
          </div>

          {/* Thumbnail preview */}
          {preview && (
            <div className="rounded-xl overflow-hidden border border-drone-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full aspect-video object-cover" />
              <div className="p-2 bg-drone-surface text-xs text-emerald-400 flex items-center gap-2">
                <span>✅</span> Thumbnail detectado automáticamente
              </div>
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
              placeholder="Un vuelo increíble sobre la Patagonia..."
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
              placeholder="Describe el video, la ubicación, el equipo utilizado..."
            />
          </div>

          {/* Region */}
          <div>
            <label htmlFor="video-region" className="label">Región</label>
            <select
              id="video-region"
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

          {/* Info notice */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-400 text-sm flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>
                Tu video quedará en estado <strong>pendiente</strong> hasta que un administrador lo apruebe.
                Normalmente tarda menos de 24 horas.
              </span>
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              disabled={loading}
              className="btn-ghost sm:w-1/3 justify-center py-3 border border-drone-border hover:bg-white/5 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              id="submit-video-btn"
              type="submit"
              disabled={loading}
              className="btn-primary sm:flex-1 justify-center py-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Enviar para revisión
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
