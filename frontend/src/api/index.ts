// Facade del cliente API: expone una única interfaz tipada que apunta al
// backend real o a los datos mock según VITE_USE_MOCK (ver src/api/config.ts).
import type { ApiClient } from './types'
import { USE_MOCK } from './config'
import { client } from './client'
import { mock } from './mock'

export { ApiError } from './client'
export type {
  AIConfigInput,
  AIConnectionResult,
  AIStatus,
  ProveedorIA,
  Channel,
  ContentConcept,
  ContentConceptGenerationResponse,
  ContentVariant,
  CrearIdeaInput,
  EditarVarianteInput,
  Idea,
  ProgramarInput,
  RechazarInput,
  ScheduledPost,
  EstadoVariante,
  EstadoProgramacion,
  ApiClient,
} from './types'
export { TONOS } from './types'
export { API_BASE_URL, USE_MOCK } from './config'

export const api: ApiClient = USE_MOCK ? mock : client