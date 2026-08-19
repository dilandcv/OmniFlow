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

// --- Conceptos de contenido (estratega IA) -------------------------------
export interface ContentConcept {
  id: number
  idea_id: number
  canal_id: number
  title: string
  description: string
  format: string
  hook: string | null
  objective: string | null
  target_audience: string | null
  call_to_action: string | null
  estimated_duration: number | null
  rationale: string | null
  seleccionado: boolean
  fecha_creacion: string
}

export interface ContentConceptGenerationResponse {
  concepts: ContentConcept[]
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

// --- Configuración de IA (runtime, backend en memoria) --------------------
// La API key jamás se persiste (ni en el backend ni en el frontend) y solo se
// usa para las llamadas /api/ai/config y /api/ai/test.
export type ProveedorIA = 'gemini' | 'anthropic' | 'openai'

export interface AIConfigInput {
  provider: string
  api_key: string
  model?: string
}

export interface AIStatus {
  configured: boolean
  provider: string | null
  model: string | null
}

export interface AIConnectionResult {
  connected: boolean
  provider: string
  model: string
  message: string
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
  getAIStatus(): Promise<AIStatus>
  configureAI(input: AIConfigInput): Promise<AIStatus>
  testAIConnection(input: AIConfigInput): Promise<AIConnectionResult>
  clearAIConfiguration(): Promise<AIStatus>
  generateContentConcepts(ideaId: number): Promise<ContentConceptGenerationResponse>
  getContentConcepts(ideaId: number): Promise<ContentConcept[]>
  selectContentConcept(conceptId: number): Promise<ContentConcept>
}

export const TONOS = ['neutral', 'divulgativo', 'profesional', 'humor', 'motivacional'] as const