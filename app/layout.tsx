import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'DroneaChile – Chile desde el Aire',
    template: '%s | DroneaChile',
  },
  description: 'Descubre Chile desde las alturas. La red social de contenido aéreo más grande de Chile. Explora paisajes, ciudades y naturaleza captados con drones.',
  keywords: ['drones', 'chile', 'videos aéreos', 'paisajes', 'fotografía aérea'],
  openGraph: {
    title: 'DroneaChile – Chile desde el Aire',
    description: 'La red social de contenido aéreo más grande de Chile',
    type: 'website',
    locale: 'es_CL',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-drone-bg text-white antialiased">
        {children}
      </body>
    </html>
  )
}
