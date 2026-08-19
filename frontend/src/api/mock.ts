// Datos MOCK con la MISMA forma que devuelve el backend, para poder
// desarrollar el frontend en paralelo y hacer demos sin levantar FastAPI ni
// gastar tokens de IA. Se persisten en localStorage para sobrevivir refrescos.
// Para usar el backend real: VITE_USE_MOCK=false (ver src/api/config.ts).
import type {
  AIConfigInput,
  AIConnectionResult,
  AIStatus,
  ApiClient,
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
} from './types'
import { ApiError } from './client'

const STORAGE_KEY = 'omniflow:mock:db'
const LATENCIA_MS = 350

// Plataformas sociales: su flujo pasa por ContentConcept (estratega), no por
// variantes directas. Espejo de backend/app/ai/strategist.py.
const SLUGS_SOCIALES = ['tiktok', 'instagram', 'facebook']

const CANALES_SEMILLA: Channel[] = [
  { id: 1, nombre: 'X (Twitter)', slug: 'x', plataforma: 'hilo', config: null },
  { id: 2, nombre: 'LinkedIn', slug: 'linkedin', plataforma: 'articulo', config: null },
  { id: 3, nombre: 'Boletín', slug: 'boletin', plataforma: 'boletin', config: null },
  { id: 4, nombre: 'Blog', slug: 'blog', plataforma: 'articulo', config: null },
  { id: 5, nombre: 'TikTok', slug: 'tiktok', plataforma: 'tiktok', config: null },
  { id: 6, nombre: 'Instagram', slug: 'instagram', plataforma: 'instagram', config: null },
  { id: 7, nombre: 'Facebook', slug: 'facebook', plataforma: 'facebook', config: null },
]

interface MockDb {
  secuencia: number
  canales: Channel[]
  ideas: Idea[]
  conceptos: ContentConcept[]
  programaciones: ScheduledPost[]
}

function seed(): MockDb {
  return { secuencia: 100, canales: CANALES_SEMILLA, ideas: [], conceptos: [], programaciones: [] }
}

function asegurarCanalesSociales(parsed: MockDb): MockDb {
  // Idempotente: agrega los canales sociales a bases mock preexistentes.
  const existentes = new Set(parsed.canales.map((c) => c.slug))
  let maxId = parsed.canales.reduce((m, c) => Math.max(m, c.id), 0)
  for (const c of CANALES_SEMILLA) {
    if (SLUGS_SOCIALES.includes(c.slug) && !existentes.has(c.slug)) {
      maxId += 1
      parsed.canales.push({ ...c, id: maxId })
    }
  }
  return parsed
}

function cargarDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MockDb>
      if (parsed && Array.isArray(parsed.canales) && parsed.canales.length > 0) {
        // Normaliza bases mock viejas (p. ej. sin el campo 'conceptos') para no
        // romper con undefined al generar/listar conceptos.
        return asegurarCanalesSociales({
          secuencia: typeof parsed.secuencia === 'number' ? parsed.secuencia : 100,
          canales: parsed.canales,
          ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
          conceptos: Array.isArray(parsed.conceptos) ? parsed.conceptos : [],
          programaciones: Array.isArray(parsed.programaciones) ? parsed.programaciones : [],
        })
      }
    }
  } catch {
    // storage no disponible: seguimos en memoria
  }
  return seed()
}

function guardarDb(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // storage lleno o no disponible: seguimos en memoria
  }
}

const db = cargarDb()

// Estado de IA del mock: SOLO en memoria del módulo. Replica el backend real,
// donde la API key nunca se persiste: al recargar la página vuelve a false.
const DEFAULT_MODELOS_MOCK: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  anthropic: 'claude-3-5-sonnet-latest',
  openai: 'gpt-4o-mini',
}
let mockAIStatus: AIStatus = { configured: false, provider: null, model: null }

function validarConfigIA(input: AIConfigInput): { provider: string; api_key: string; model: string } {
  const provider = (input.provider ?? '').trim().toLowerCase()
  const api_key = (input.api_key ?? '').trim()
  if (!provider) throw new ApiError('Elegí un proveedor de IA.', 400)
  if (!DEFAULT_MODELOS_MOCK[provider]) {
    throw new ApiError(`Proveedor desconocido: '${provider}'. Válidos: gemini, anthropic, openai.`, 400)
  }
  if (!api_key) throw new ApiError('La API key es obligatoria.', 400)
  const model = (input.model ?? '').trim() || DEFAULT_MODELOS_MOCK[provider]
  return { provider, api_key, model }
}

function esperar(ms = LATENCIA_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function proximoId(): number {
  db.secuencia += 1
  guardarDb()
  return db.secuencia
}

function copia<T>(valor: T): T {
  return JSON.parse(JSON.stringify(valor)) as T
}

function contenidoMock(premisa: string, canal: Channel): string {
  const base = `[Mock] Contenido para ${canal.nombre} generado a partir de: "${premisa}".`
  switch (canal.plataforma) {
    case 'hilo':
      return `${base}\n---\nSegundo tweet de ejemplo escritos con gancho.\n---\nTercer tweet con llamada a la acción.`
    case 'boletin':
      return `${base}\n\nSaludo, desarrollo del tema principal y cierre con CTA.`
    default:
      return `${base}\n\nIntroducción, desarrollo con subtítulos y conclusión ampliada.`
  }
}

// Plantillas de conceptos por plataforma para el mock (variedad de ángulo y
// formato, como pediría el prompt real de estrategia).
const PLANTILLAS_CONCEPTO: Record<string, { formato: string; angulo: string }[]> = {
  tiktok: [
    { formato: 'short_video', angulo: '3 cosas que ya cambiaron' },
    { formato: 'tutorial', angulo: 'Paso a paso para empezar hoy' },
    { formato: 'storytelling', angulo: 'La historia real detrás de esto' },
    { formato: 'listicle', angulo: 'Los 5 errores más comunes' },
    { formato: 'comparison', angulo: 'Antes vs. después' },
  ],
  instagram: [
    { formato: 'carousel', angulo: '5 claves en diapositivas' },
    { formato: 'reel', angulo: 'Lo que nadie te cuenta' },
    { formato: 'post', angulo: 'Reflexión con pregunta abierta' },
    { formato: 'story', angulo: 'Encuesta rápida para la audiencia' },
    { formato: 'carousel', angulo: 'Mitos vs. realidad' },
  ],
  facebook: [
    { formato: 'discussion', angulo: 'Debate: ¿a favor o en contra?' },
    { formato: 'post', angulo: 'Tip educativo para guardar' },
    { formato: 'short_video', angulo: 'Explicación en 1 minuto' },
    { formato: 'story', angulo: 'Dato curioso del día' },
    { formato: 'discussion', angulo: 'Compartí tu experiencia' },
  ],
}

function conceptosMock(premisa: string, canal: Channel): ContentConcept[] {
  const plantillas = PLANTILLAS_CONCEPTO[canal.slug] ?? PLANTILLAS_CONCEPTO.tiktok
  const ahora = new Date().toISOString()
  return plantillas.map((p, i) => ({
    id: proximoId(),
    idea_id: -1, // se rellena en generateContentConcepts
    canal_id: canal.id,
    title: `${canal.nombre}: ${p.angulo}`,
    description: `Propuesta de contenido "${p.angulo}" a partir de: "${premisa}".`,
    format: p.formato,
    hook: `¿Sabías esto sobre ${premisa.toLowerCase()}?`,
    objective: i % 2 === 0 ? 'education' : 'engagement',
    target_audience: 'creadores y profesionales',
    call_to_action: 'Guardá este contenido para volver a verlo.',
    estimated_duration: p.formato === 'short_video' || p.formato === 'reel' ? 45 : null,
    rationale: `El ángulo "${p.angulo}" con formato ${p.formato} encaja con la plataforma y el tono pedido.`,
    seleccionado: false,
    fecha_creacion: ahora,
  }))
}

export const mock: ApiClient = {
  async listarCanales(): Promise<Channel[]> {
    await esperar()
    return copia(db.canales)
  },

  async crearIdea(input: CrearIdeaInput): Promise<Idea> {
    await esperar()
    if (!input.premisa.trim() || input.premisa.trim().length < 3) {
      throw new ApiError('La premisa debe tener al menos 3 caracteres.', 400)
    }
    const canales = db.canales.filter((c) => input.canal_ids.includes(c.id))
    if (canales.length !== input.canal_ids.length) {
      throw new ApiError('Alguno de los canales seleccionados no existe.', 404)
    }
    if (canales.length === 0) {
      throw new ApiError('Seleccioná al menos un canal.', 400)
    }

    const ahora = new Date().toISOString()
    const id = proximoId()
    // Las plataformas sociales no generan variantes directas: su flujo pasa por
    // ContentConcept (ver generateContentConcepts).
    const canalesLegacy = canales.filter((c) => !SLUGS_SOCIALES.includes(c.slug))
    const idea: Idea = {
      id,
      premisa: input.premisa.trim(),
      tono: input.tono,
      fecha_creacion: ahora,
      canales: copia(canales),
      variantes: canalesLegacy.map((canal) => ({
        id: proximoId(),
        idea_id: id,
        canal_id: canal.id,
        formato: canal.plataforma,
        contenido: contenidoMock(input.premisa.trim(), canal),
        estado: 'borrador',
        rechazada: false,
        motivo_rechazo: null,
        fecha_creacion: ahora,
        fecha_actualizacion: ahora,
      })),
    }
    db.ideas.push(copia(idea))
    guardarDb()
    return copia(idea)
  },

  async listarVariantes(ideaId: number): Promise<ContentVariant[]> {
    await esperar(150)
    const idea = db.ideas.find((i) => i.id === ideaId)
    if (!idea) throw new ApiError('La idea no existe.', 404)
    return copia(idea.variantes)
  },

  async editarVariante(id: number, input: EditarVarianteInput): Promise<ContentVariant> {
    await esperar()
    const variante = db.ideas.flatMap((i) => i.variantes).find((v) => v.id === id)
    if (!variante) throw new ApiError('La variante no existe.', 404)
    if (variante.estado !== 'borrador') {
      throw new ApiError(`Solo se puede editar una variante en estado 'borrador' (actual: ${variante.estado}).`, 400)
    }
    if (input.contenido !== undefined) variante.contenido = input.contenido
    if (input.formato !== undefined) variante.formato = input.formato
    variante.rechazada = false
    variante.motivo_rechazo = null
    variante.fecha_actualizacion = new Date().toISOString()
    guardarDb()
    return copia(variante)
  },

  async aprobarVariante(id: number): Promise<ContentVariant> {
    await esperar()
    const variante = db.ideas.flatMap((i) => i.variantes).find((v) => v.id === id)
    if (!variante) throw new ApiError('La variante no existe.', 404)
    if (variante.estado !== 'borrador') {
      throw new ApiError(`Solo se puede aprobar una variante en estado 'borrador' (actual: ${variante.estado}).`, 400)
    }
    variante.estado = 'aprobado'
    variante.rechazada = false
    variante.motivo_rechazo = null
    variante.fecha_actualizacion = new Date().toISOString()
    guardarDb()
    return copia(variante)
  },

  async rechazarVariante(id: number, input?: RechazarInput): Promise<ContentVariant> {
    await esperar()
    const variante = db.ideas.flatMap((i) => i.variantes).find((v) => v.id === id)
    if (!variante) throw new ApiError('La variante no existe.', 404)
    if (variante.estado !== 'borrador') {
      throw new ApiError(`Solo se puede rechazar una variante en estado 'borrador' (actual: ${variante.estado}).`, 400)
    }
    variante.rechazada = true
    variante.motivo_rechazo = input?.motivo ?? null
    variante.fecha_actualizacion = new Date().toISOString()
    guardarDb()
    return copia(variante)
  },

  async listarProgramaciones(estado?: string): Promise<ScheduledPost[]> {
    await esperar(150)
    let lista = db.programaciones
    if (estado) lista = lista.filter((p) => p.estado === estado)
    return copia(lista.sort((a, b) => a.programado_para.localeCompare(b.programado_para)))
  },

  async programarVariante(input: ProgramarInput): Promise<ScheduledPost> {
    await esperar()
    const variante = db.ideas.flatMap((i) => i.variantes).find((v) => v.id === input.variante_id)
    if (!variante) throw new ApiError('La variante no existe.', 404)
    if (variante.estado !== 'aprobado') {
      throw new ApiError(`Solo se puede programar una variante aprobada (estado actual: ${variante.estado}).`, 400)
    }
    const existente = db.programaciones.find(
      (p) => p.variante_id === input.variante_id && p.estado !== 'cancelado',
    )
    if (existente) throw new ApiError('La variante ya tiene una programación activa.', 400)

    const post: ScheduledPost = {
      id: proximoId(),
      variante_id: input.variante_id,
      programado_para: input.programado_para,
      estado: 'pendiente',
      fecha_publicacion: null,
      enlace_externo: null,
    }
    db.programaciones.push(post)
    variante.estado = 'programado'
    variante.fecha_actualizacion = new Date().toISOString()
    guardarDb()
    return copia(post)
  },

  async cancelarProgramacion(id: number): Promise<ScheduledPost> {
    await esperar()
    const post = db.programaciones.find((p) => p.id === id)
    if (!post) throw new ApiError('La programación no existe.', 404)
    if (post.estado === 'publicado') {
      throw new ApiError('No se puede cancelar una publicación ya realizada.', 400)
    }
    post.estado = 'cancelado'
    const variante = db.ideas.flatMap((i) => i.variantes).find((v) => v.id === post.variante_id)
    if (variante) {
      variante.estado = 'aprobado'
      variante.fecha_actualizacion = new Date().toISOString()
    }
    guardarDb()
    return copia(post)
  },

  async getAIStatus(): Promise<AIStatus> {
    await esperar(150)
    return copia(mockAIStatus)
  },

  async configureAI(input: AIConfigInput): Promise<AIStatus> {
    await esperar()
    const { provider, model } = validarConfigIA(input)
    // La API key NO se retiene ni siquiera en el mock: se consume y se descarta.
    mockAIStatus = { configured: true, provider, model }
    return copia(mockAIStatus)
  },

  async testAIConnection(input: AIConfigInput): Promise<AIConnectionResult> {
    await esperar(700)
    const { provider, model } = validarConfigIA(input)
    return { connected: true, provider, model, message: `Conexión correcta con '${provider}' (modelo ${model}).` }
  },

  async clearAIConfiguration(): Promise<AIStatus> {
    await esperar()
    mockAIStatus = { configured: false, provider: null, model: null }
    return copia(mockAIStatus)
  },

  async generateContentConcepts(ideaId: number): Promise<ContentConceptGenerationResponse> {
    await esperar(900)
    const idea = db.ideas.find((i) => i.id === ideaId)
    if (!idea) throw new ApiError('La idea no existe.', 404)
    const sociales = idea.canales.filter((c) => SLUGS_SOCIALES.includes(c.slug))
    if (sociales.length === 0) {
      throw new ApiError('La idea no tiene canales de plataformas sociales seleccionados.', 400)
    }
    const nuevos: ContentConcept[] = []
    for (const canal of sociales) {
      for (const c of conceptosMock(idea.premisa, canal)) {
        nuevos.push({ ...c, idea_id: ideaId })
      }
    }
    db.conceptos.push(...copia(nuevos))
    guardarDb()
    return { concepts: copia(nuevos) }
  },

  async getContentConcepts(ideaId: number): Promise<ContentConcept[]> {
    await esperar(150)
    if (!db.ideas.some((i) => i.id === ideaId)) throw new ApiError('La idea no existe.', 404)
    return copia(
      db.conceptos
        .filter((c) => c.idea_id === ideaId)
        .sort((a, b) => a.canal_id - b.canal_id || a.id - b.id),
    )
  },

  async selectContentConcept(conceptId: number): Promise<ContentConcept> {
    await esperar()
    const concepto = db.conceptos.find((c) => c.id === conceptId)
    if (!concepto) throw new ApiError('El concepto no existe.', 404)
    for (const c of db.conceptos) {
      if (c.idea_id === concepto.idea_id) c.seleccionado = c.id === conceptId
    }
    guardarDb()
    return copia(concepto)
  },
}