// Cliente HTTP real contra el backend FastAPI (endpoints bajo /api).
// Mapeo de endpoints (lo que expone el backend en backend/app/api/):
//   GET    /canales
//   POST   /ideas                         { premisa, tono, canal_ids }
//   GET    /ideas/{id}/variantes
//   PATCH  /variantes/{id}                { contenido?, formato? }
//   POST   /variantes/{id}/aprobar
//   POST   /variantes/{id}/rechazar       { motivo? }
//   GET    /programaciones?estado=
//   POST   /programaciones                { variante_id, programado_para }
//   DELETE /programaciones/{id}
import type {
  ApiClient,
  Channel,
  ContentVariant,
  CrearIdeaInput,
  EditarVarianteInput,
  Idea,
  ProgramarInput,
  RechazarInput,
  ScheduledPost,
} from './types'
import { API_BASE_URL } from './config'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let resp: Response
  try {
    resp = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError(
      `No se pudo conectar con el backend en ${API_BASE_URL}. ¿Está corriendo? Revisá VITE_API_URL.`,
      0,
    )
  }

  if (!resp.ok) {
    let detalle = `El servidor respondió con error ${resp.status}`
    try {
      const body = (await resp.json()) as { detail?: unknown }
      if (typeof body.detail === 'string') detalle = body.detail
    } catch {
      // sin cuerpo JSON: usamos el detalle genérico
    }
    throw new ApiError(detalle, resp.status)
  }

  if (resp.status === 204) return undefined as T
  return (await resp.json()) as T
}

export const client: ApiClient = {
  async listarCanales(): Promise<Channel[]> {
    return request<Channel[]>('/canales')
  },

  async crearIdea(input: CrearIdeaInput): Promise<Idea> {
    return request<Idea>('/ideas', { method: 'POST', body: JSON.stringify(input) })
  },

  async listarVariantes(ideaId: number): Promise<ContentVariant[]> {
    return request<ContentVariant[]>(`/ideas/${ideaId}/variantes`)
  },

  async editarVariante(id: number, input: EditarVarianteInput): Promise<ContentVariant> {
    return request<ContentVariant>(`/variantes/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
  },

  async aprobarVariante(id: number): Promise<ContentVariant> {
    return request<ContentVariant>(`/variantes/${id}/aprobar`, { method: 'POST' })
  },

  async rechazarVariante(id: number, input?: RechazarInput): Promise<ContentVariant> {
    return request<ContentVariant>(`/variantes/${id}/rechazar`, {
      method: 'POST',
      body: input ? JSON.stringify(input) : undefined,
    })
  },

  async listarProgramaciones(estado?: string): Promise<ScheduledPost[]> {
    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : ''
    return request<ScheduledPost[]>(`/programaciones${qs}`)
  },

  async programarVariante(input: ProgramarInput): Promise<ScheduledPost> {
    return request<ScheduledPost>('/programaciones', { method: 'POST', body: JSON.stringify(input) })
  },

  async cancelarProgramacion(id: number): Promise<ScheduledPost> {
    return request<ScheduledPost>(`/programaciones/${id}`, { method: 'DELETE' })
  },
}