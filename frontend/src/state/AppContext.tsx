// Estado ligero de la app (sin librerías externas): navegación entre vistas y
// catálogo de ideas conocidas, persistido en localStorage como caché para
// sobrevivir refrescos (en modo mock es la fuente de datos de sesión).
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Idea } from '../api/types'

export type Vista = 'idea' | 'variantes' | 'programacion' | 'ai'

interface AppContextValue {
  vista: Vista
  ideaActualId: number | null
  navegar: (v: Vista, ideaId?: number | null) => void
  ideas: Idea[]
  guardarIdea: (idea: Idea) => void
  actualizarVariante: (ideaId: number, variante: Idea['variantes'][number]) => void
}

const KEY = 'omniflow:ideas'

const AppContext = createContext<AppContextValue | null>(null)

function cargarIdeas(): Idea[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Idea[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // storage no disponible
  }
  return []
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [vista, setVista] = useState<Vista>('idea')
  const [ideaActualId, setIdeaActualId] = useState<number | null>(null)
  const [ideas, setIdeas] = useState<Idea[]>(cargarIdeas)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ideas))
    } catch {
      // storage no disponible: seguimos en memoria
    }
  }, [ideas])

  const navegar = useCallback((v: Vista, ideaId?: number | null) => {
    setVista(v)
    setIdeaActualId(ideaId ?? null)
  }, [])

  const guardarIdea = useCallback((idea: Idea) => {
    setIdeas((prev) => {
      const idx = prev.findIndex((i) => i.id === idea.id)
      if (idx === -1) return [...prev, idea]
      const copia = [...prev]
      copia[idx] = idea
      return copia
    })
  }, [])

  const actualizarVariante = useCallback((ideaId: number, variante: Idea['variantes'][number]) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea
        const idx = idea.variantes.findIndex((v) => v.id === variante.id)
        if (idx === -1) return { ...idea, variantes: [...idea.variantes, variante] }
        const variantes = [...idea.variantes]
        variantes[idx] = variante
        return { ...idea, variantes }
      }),
    )
  }, [])

  const value = useMemo(
    () => ({ vista, ideaActualId, navegar, ideas, guardarIdea, actualizarVariante }),
    [vista, ideaActualId, navegar, ideas, guardarIdea, actualizarVariante],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>.')
  return ctx
}