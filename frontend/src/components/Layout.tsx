// Layout base con Tailwind: barra de navegación superior y contenedor
// responsive. Navegación simple sin librería de rutas.
import type { ReactNode } from 'react'
import { useApp } from '../state/AppContext'

interface NavItem {
  clave: 'idea' | 'conceptos' | 'variantes' | 'programacion' | 'ai'
  etiqueta: string
}

const NAV: NavItem[] = [
  { clave: 'idea', etiqueta: 'Nueva idea' },
  { clave: 'conceptos', etiqueta: 'Conceptos' },
  { clave: 'variantes', etiqueta: 'Variantes' },
  { clave: 'programacion', etiqueta: 'Programación' },
  { clave: 'ai', etiqueta: 'Configuración de IA' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { vista, navegar, ideaActualId } = useApp()

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => navegar('idea')} className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              O
            </span>
            <span className="text-lg font-semibold tracking-tight">OmniFlow</span>
          </button>

          <nav className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {NAV.map((item) => {
              const activo = vista === item.clave
              return (
                <button
                  key={item.clave}
                  type="button"
                  onClick={() =>
                    navegar(
                      item.clave,
                      item.clave === 'variantes' || item.clave === 'conceptos' ? ideaActualId : null,
                    )
                  }
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    activo ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item.etiqueta}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>

      <footer className="mx-auto max-w-5xl px-4 pb-8 text-center text-xs text-slate-400">
        Central de Inteligencia de Contenido y Programación Omnicanal
      </footer>
    </div>
  )
}