import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="border-t border-drone-border bg-drone-surface mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 flex-shrink-0 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]">
                <Image
                  src="/logo-v2.png"
                  alt="DroneaChile"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-xl">
                Dronea<span className="text-sky-400">Chile</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              La plataforma de contenido aéreo más grande de Chile. Descubre paisajes,
              ciudades y naturaleza desde las alturas.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Explorar</h3>
            <ul className="space-y-2">
              {['Inicio', 'Explorar videos', 'Regiones', 'Trending'].map((item) => (
                <li key={item}>
                  <Link href="/explorar" className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Comunidad</h3>
            <ul className="space-y-2">
              {[
                { label: 'Subir video', href: '/dashboard/upload' },
                { label: 'Mi cuenta', href: '/dashboard' },
                { label: 'Registrarse', href: '/auth/register' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-400 hover:text-sky-400 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-drone-border mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} DroneaChile. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Plataforma activa · Chile
          </div>
        </div>
      </div>
    </footer>
  )
}
