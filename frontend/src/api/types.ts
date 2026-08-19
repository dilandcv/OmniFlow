// Tipos que reflejan EXACTAMENTE lo que devuelve el backend FastAPI
// (app/schemas/ en backend/), para que el cliente pueda apuntar a la API real
// tal cual. Campos en snake_case porque así llegan desde el backend.

export interface Channel {
  id: number
  nombre: string
  slug: string
  plataforma: string
  config: Record<string, unknown> | null
}

export type EstadoVariante = 'borrador' | 'aprobado' | 'programado' | 'publicado'

export interface ContentVariant {
  id: number
  idea_id: number
  canal_id: number
  formato: string
  contenido: string
  estado: EstadoVariante
  rechazada: boolean
  motivo_rechazo: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Idea {
  id: number
  premisa: string
  tono: string
  fecha_creacion: string
  canales: Channel[]
  variantes: ContentVariant[]
}

export type EstadoProgramacion = 'pendiente' | 'publicado' | 'cancelado'

export interface ScheduledPost {
  id: number
  variante_id: number
  programado_para: string
  estado: EstadoProgramacion
  fecha_publicacion: string | null
  enlace_externo: string | null
}

// --- Entradas (request bodies) ------------------------------------------
export interface CrearIdeaInput {
  premisa: string
  tono: string
  canal_ids: number[]
}

export interface EditarVarianteInput {
  contenido?: string
  formato?: string
}

export interface ProgramarInput {
  variante_id: number
  programado_para: string // ISO 8601
}

export interface RechazarInput {
  motivo?: string
}

// Contrato compartido por la implementación real y la mock.
export interface ApiClient {
  listarCanales(): Promise<Channel[]>
  crearIdea(input: CrearIdeaInput): Promise<Idea>
  listarVariantes(ideaId: number): Promise<ContentVariant[]>
  editarVariante(id: number, input: EditarVarianteInput): Promise<ContentVariant>
  aprobarVariante(id: number): Promise<ContentVariant>
  rechazarVariante(id: number, input?: RechazarInput): Promise<ContentVariant>
  listarProgramaciones(estado?: string): Promise<ScheduledPost[]>
  programarVariante(input: ProgramarInput): Promise<ScheduledPost>
  cancelarProgramacion(id: number): Promise<ScheduledPost>
}

export const TONOS = ['neutral', 'divulgativo', 'profesional', 'humor', 'motivacional'] as const