// Datos MOCK con la MISMA forma que devuelve el backend, para poder
// desarrollar el frontend en paralelo y hacer demos sin levantar FastAPI ni
// gastar tokens de IA. Se persisten en localStorage para sobrevivir refrescos.
// Para usar el backend real: VITE_USE_MOCK=false (ver src/api/config.ts).
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
import { ApiError } from './client'

const STORAGE_KEY = 'omniflow:mock:db'
const LATENCIA_MS = 350

const CANALES_SEMILLA: Channel[] = [
  { id: 1, nombre: 'X (Twitter)', slug: 'x', plataforma: 'hilo', config: null },
  { id: 2, nombre: 'LinkedIn', slug: 'linkedin', plataforma: 'articulo', config: null },
  { id: 3, nombre: 'Boletín', slug: 'boletin', plataforma: 'boletin', config: null },
  { id: 4, nombre: 'Blog', slug: 'blog', plataforma: 'articulo', config: null },
]

interface MockDb {
  secuencia: number
  canales: Channel[]
  ideas: Idea[]
  programaciones: ScheduledPost[]
}

function seed(): MockDb {
  return { secuencia: 100, canales: CANALES_SEMILLA, ideas: [], programaciones: [] }
}

function cargarDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed && Array.isArray(parsed.canales) && parsed.canales.length > 0) return parsed
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
    const idea: Idea = {
      id,
      premisa: input.premisa.trim(),
      tono: input.tono,
      fecha_creacion: ahora,
      canales: copia(canales),
      variantes: canales.map((canal) => ({
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
}