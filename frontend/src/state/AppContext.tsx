// Estado ligero de la app (sin librerías externas): navegación entre vistas,
// catálogo de ideas conocidas (caché en localStorage) y estado de configuración
// de IA. La API key NUNCA vive en este estado: solo {configured, provider, model}.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api'
import type { AIStatus, Idea } from '../api'

export type Vista = 'idea' | 'conceptos' | 'variantes' | 'programacion' | 'ai'

const AI_STATUS_INICIAL: AIStatus = { configured: false, provider: null, model: null }

interface AppContextValue {
  vista: Vista
  ideaActualId: number | null
  navegar: (v: Vista, ideaId?: number | null) => void
  ideas: Idea[]
  guardarIdea: (idea: Idea) => void
  actualizarVariante: (ideaId: number, variante: Idea['variantes'][number]) => void
  aiStatus: AIStatus
  actualizarAIStatus: (s: AIStatus) => void
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
  const [aiStatus, setAiStatus] = useState<AIStatus>(AI_STATUS_INICIAL)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ideas))
    } catch {
      // storage no disponible: seguimos en memoria
    }
  }, [ideas])

  // Refresca el estado de IA al montar: si el backend se reinició, la config
  // en memoria se perdió y el estado vuelve a {configured: false}.
  useEffect(() => {
    let activo = true
    api
      .getAIStatus()
      .then((s) => {
        if (activo) setAiStatus(s)
      })
      .catch(() => {
        // sin backend: conservamos el estado inicial (no es bloqueante)
      })
    return () => {
      activo = false
    }
  }, [])

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

  const actualizarAIStatus = useCallback((s: AIStatus) => {
    setAiStatus(s)
  }, [])

  const value = useMemo(
    () => ({
      vista,
      ideaActualId,
      navegar,
      ideas,
      guardarIdea,
      actualizarVariante,
      aiStatus,
      actualizarAIStatus,
    }),
    [vista, ideaActualId, navegar, ideas, guardarIdea, actualizarVariante, aiStatus, actualizarAIStatus],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>.')
  return ctx
}