// Vista "Variantes generadas" — rediseño editorial comic: panels, números gigantes, tratamiento poster
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type ContentVariant } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'
import { EstadoBadge } from '../components/EstadoBadge'
import { SplatterSmall } from '../components/graphics/Splatter'
import { IconTikTok, IconInstagram, IconFacebook } from '../components/graphics/OmniIcons'

function channelIcon(nombre: string, slug?: string) {
  const k = (slug ?? nombre).toLowerCase()
  if (k.includes('tiktok')) return <IconTikTok size={14} />
  if (k.includes('instagram')) return <IconInstagram size={14} />
  if (k.includes('facebook')) return <IconFacebook size={14} />
  return <span className="font-display text-xs">{nombre[0]}</span>
}

function VarianteCard({
  variante,
  canalNombre,
  canalSlug,
  index,
  onCambio,
}: {
  variante: ContentVariant
  canalNombre: string
  canalSlug?: string
  index: number
  onCambio: (actualizada: ContentVariant) => void
}) {
  const [texto, setTexto] = useState(variante.contenido)
  const [guardando, setGuardando] = useState(false)
  const [animando, setAnimando] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTexto(variante.contenido)
  }, [variante.contenido, variante.id])

  const esBorrador = variante.estado === 'borrador'
  const esRechazada = variante.rechazada
  const hayCambios = texto !== variante.contenido

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      const actualizada = await api.editarVariante(variante.id, { contenido: texto })
      onCambio(actualizada)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el cambio.')
    } finally {
      setGuardando(false)
    }
  }

  const aprobar = async () => {
    setAnimando(true)
    setError(null)
    try {
      const actualizada = await api.aprobarVariante(variante.id)
      onCambio(actualizada)
      setMostrarMotivo(false)
      setMotivo('')
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo aprobar la variante.')
    } finally {
      setAnimando(false)
    }
  }

  const rechazar = async () => {
    setAnimando(true)
    setError(null)
    try {
      const actualizada = await api.rechazarVariante(variante.id, { motivo: motivo || undefined })
      onCambio(actualizada)
      setMostrarMotivo(false)
      setMotivo('')
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo rechazar la variante.')
    } finally {
      setAnimando(false)
    }
  }

  // border color per channel
  const accent = canalSlug?.toLowerCase().includes('tiktok')
    ? '#E10600'
    : canalSlug?.toLowerCase().includes('instagram')
      ? '#111111'
      : '#050505'

  return (
    <article
      className={`relative bg-white border-[3px] border-black shadow-[5px_5px_0_#111] overflow-hidden group hover:shadow-[7px_7px_0_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all ${
        esRechazada ? 'opacity-90 grayscale-[0.2]' : ''
      }`}
    >
      {/* Top bar like comic panel header */}
      <header className="flex items-stretch border-b-[3px] border-black">
        <div
          className="flex items-center justify-center px-3 py-2 border-r-[3px] border-black font-display text-2xl leading-none shrink-0"
          style={{ background: accent, color: 'white' }}
        >
          {String(index + 1).padStart(2, '0')}
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#F5F5F5] min-w-0">
          <span className="size-7 bg-black text-white flex items-center justify-center border border-black shrink-0">{channelIcon(canalNombre, canalSlug)}</span>
          <div className="min-w-0">
            <p className="font-condensed font-black text-xs tracking-[0.1em] leading-none truncate">{canalNombre.toUpperCase()}</p>
            <p className="text-[10px] font-mono-omni text-black/50 tracking-widest">{variante.formato.toUpperCase()} • #{variante.id}</p>
          </div>
          <span className="ml-auto hidden sm:block h-1 w-12 bg-black opacity-20" />
        </div>
        <div className="px-2 py-2 flex items-center bg-white border-l-[3px] border-black shrink-0">
          <EstadoBadge estado={variante.estado} />
        </div>
      </header>

      {/* Red ink stripe if approved */}
      {variante.estado === 'aprobado' && <div className="h-1.5 w-full bg-[#E10600] relative overflow-hidden"><div className="absolute inset-0 halftone-black opacity-20" /></div>}
      {esRechazada && <div className="h-1.5 w-full bg-black" />}

      {/* Content */}
      <div className="p-4 relative">
        {esRechazada && <div className="absolute top-2 right-2 bg-black text-white text-[9px] font-black px-2 py-1 rotate-1">RECHAZADA</div>}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          readOnly={!esBorrador}
          rows={5}
          className={`w-full border-2 px-3 py-3 text-sm leading-relaxed resize-none focus:outline-none ${
            esBorrador
              ? 'bg-white border-black focus:border-[#E10600] focus:shadow-[3px_3px_0_#E10600] placeholder:text-black/40'
              : 'bg-[#F5F5F5] border-black/15 text-black/70 cursor-not-allowed'
          }`}
          placeholder="Contenido de la variante…"
        />
        {esRechazada && variante.motivo_rechazo && (
          <p className="mt-2 border-2 border-black bg-[#E10600] text-white px-3 py-2 text-xs font-bold flex gap-2">
            <span className="bg-black px-1.5 text-[9px] h-fit py-0.5">MOTIVO</span> {variante.motivo_rechazo}
          </p>
        )}
        {error && (
          <div className="mt-2">
            <ErrorAlert mensaje={error} />
          </div>
        )}
      </div>

      {esBorrador && (
        <footer className="px-4 pb-4 flex flex-wrap items-center gap-2 border-t-2 border-black/10 pt-3 bg-[#F5F5F5]/60">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !hayCambios}
            className="border-2 border-black bg-white px-3 py-1.5 text-xs font-black tracking-widest hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {guardando ? 'GUARDANDO…' : 'GUARDAR'}
          </button>
          <button
            type="button"
            onClick={aprobar}
            disabled={animando}
            className="bg-[#E10600] border-2 border-black text-white px-4 py-1.5 text-xs font-black tracking-widest hover:bg-black hover:text-white disabled:opacity-50 transition-colors shadow-[2px_2px_0_#111]"
          >
            {animando ? '…' : 'APROBAR ✓'}
          </button>
          <button
            type="button"
            onClick={() => setMostrarMotivo((v) => !v)}
            disabled={animando}
            className="border-2 border-black bg-white px-3 py-1.5 text-xs font-black tracking-widest text-black hover:bg-black hover:text-white disabled:opacity-50"
          >
            {mostrarMotivo ? 'CANCELAR' : 'RECHAZAR'}
          </button>
          {mostrarMotivo && (
            <div className="flex w-full flex-col sm:flex-row gap-2 pt-2 border-t border-black/10 mt-2">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="MOTIVO DEL RECHAZO (opcional)"
                className="flex-1 border-2 border-black px-3 py-2 text-xs font-mono-omni tracking-wide focus:border-[#E10600] focus:outline-none"
              />
              <button type="button" onClick={rechazar} disabled={animando} className="shrink-0 bg-black text-white border-2 border-black px-4 py-2 text-xs font-black tracking-widest hover:bg-[#E10600]">
                CONFIRMAR
              </button>
            </div>
          )}
        </footer>
      )}

      <footer className="px-4 py-1.5 bg-black text-white flex items-center justify-between">
        <span className="text-[9px] font-mono-omni tracking-[0.16em] text-white/60">UPDATED: {variante.fecha_actualizacion}</span>
        <span className="text-[9px] font-mono-omni bg-[#E10600] px-1.5 py-0.5 font-black">OMNI • {variante.estado.toUpperCase()}</span>
      </footer>

      {/* halftone corner */}
      <div className="absolute bottom-0 right-0 w-20 h-20 halftone opacity-[0.04] pointer-events-none" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
    </article>
  )
}

export function Variantes() {
  const { ideaActualId, ideas, navegar, actualizarVariante } = useApp()
  const idea = useMemo(() => ideas.find((i) => i.id === ideaActualId), [ideas, ideaActualId])

  const [variantes, setVariantes] = useState<ContentVariant[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    if (ideaActualId === null) return
    setCargando(true)
    setError(null)
    api
      .listarVariantes(ideaActualId)
      .then(setVariantes)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las variantes.'))
      .finally(() => setCargando(false))
  }, [ideaActualId])

  useEffect(cargar, [cargar])

  // Group variantes by channel
  const grupos = useMemo(() => {
    const map = new Map<string, { channelName: string; slug: string; items: ContentVariant[] }>()
    for (const v of variantes) {
      const canal = idea?.canales.find((c) => c.id === v.canal_id)
      const nombre = canal ? canal.nombre : `Canal #${v.canal_id}`
      const slug = canal?.slug ?? canal?.nombre ?? nombre
      const key = nombre
      if (!map.has(key)) map.set(key, { channelName: nombre, slug, items: [] })
      map.get(key)!.items.push(v)
    }
    return [...map.values()]
  }, [variantes, idea])

  if (ideaActualId === null) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-[#111111] text-white border-[3px] border-black shadow-[8px_8px_0_#111] p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#E10600]" />
          <div className="absolute inset-0 halftone-white opacity-[0.06] pointer-events-none" />
          <p className="relative font-display text-3xl leading-none">NO IDEA SELECTED</p>
          <p className="relative mt-2 text-sm text-white/60 font-mono-omni tracking-wide">Aún no hay una idea seleccionada. Creá una nueva para generar conceptos.</p>
          <button
            type="button"
            onClick={() => navegar('idea')}
            className="relative mt-6 bg-[#E10600] border-2 border-black text-white px-6 py-3 font-black tracking-widest text-xs hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0_#000]"
          >
            ← CREAR NUEVA IDEA
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header poster */}
      <header className="relative bg-white border-[3px] border-black shadow-[6px_6px_0_#111] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#E10600]" />
        <div className="absolute top-0 right-0 w-32 h-16 opacity-10 pointer-events-none">
          <SplatterSmall className="w-full h-full" />
        </div>
        <div className="p-5 lg:p-6">
          <button type="button" onClick={() => navegar('idea')} className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-black tracking-widest border-2 border-black hover:bg-[#E10600] transition-colors">
            ← NUEVA IDEA
          </button>
          <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono-omni tracking-[0.2em] text-[#E10600]">CONTENT CONCEPTS • EDITORIAL PANELS</p>
              <h1 className="font-display text-4xl lg:text-5xl leading-none mt-1">
                CONTENT <span className="text-[#E10600]">CONCEPTS</span>
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-black text-white px-2 py-1 text-[10px] font-mono-omni tracking-widest">IDEA #{ideaActualId}</span>
                <span className="text-xs font-mono-omni text-black/60 truncate max-w-xl hidden lg:inline">{idea?.premisa ?? 'Premisa remota'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-[#E10600] text-white px-3 py-2 border-2 border-black text-center">
                <p className="font-display text-xl leading-none">{variantes.length}</p>
                <p className="text-[8px] font-mono-omni tracking-widest">VARIANTES</p>
              </div>
              <div className="bg-black text-white px-3 py-2 border-2 border-black text-center">
                <p className="font-display text-xl leading-none">{grupos.length}</p>
                <p className="text-[8px] font-mono-omni tracking-widest">CANALES</p>
              </div>
            </div>
          </div>
          {idea ? (
            <div className="mt-4 border-2 border-black bg-[#F5F5F5] p-3 flex flex-wrap gap-2 items-center relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E10600]" />
              <span className="bg-black text-white px-2 py-1 text-[9px] font-black tracking-widest ml-2">PREMISA:</span>
              <span className="text-sm text-black leading-tight flex-1">“{idea.premisa}”</span>
              <span className="bg-[#E10600] text-white px-2 py-1 text-[10px] font-black tracking-widest border border-black">TONO: {idea.tono.toUpperCase()}</span>
            </div>
          ) : (
            <p className="mt-3 text-xs font-mono-omni bg-amber-100 border-2 border-amber-300 px-3 py-2">
              Idea #{ideaActualId} no encontrada en catálogo local — se muestran las variantes del backend igualmente.
            </p>
          )}
        </div>
        {/* bottom red splatter divider like reference */}
        <div className="h-2 bg-[#E10600] relative overflow-hidden">
          <div className="absolute inset-0 halftone-black opacity-20" />
        </div>
      </header>

      {error && <ErrorAlert mensaje={error} onReintentar={cargar} />}
      {cargando ? (
        <Loading mensaje="CARGANDO CONCEPTOS…" />
      ) : variantes.length === 0 ? (
        <div className="border-[3px] border-dashed border-black bg-white p-10 text-center shadow-[6px_6px_0_#111]">
          <p className="font-display text-2xl">EMPTY ISSUE</p>
          <p className="text-sm font-mono-omni text-black/60 mt-1">Esta idea aún no tiene variantes generadas.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map((g) => (
            <section key={g.channelName} className="relative">
              {/* Channel header like newspaper */}
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-black text-white px-4 py-2 font-display text-lg leading-none tracking-wide flex items-center gap-2 border-2 border-black">
                  <span className="size-6 bg-[#E10600] flex items-center justify-center text-white border border-white">{channelIcon(g.channelName, g.slug)}</span>
                  {g.channelName.toUpperCase()}
                  <span className="bg-white text-black text-[9px] font-mono-omni px-1.5 py-0.5 tracking-widest ml-2">{g.items.length} PANELS</span>
                </div>
                <div className="h-0.5 flex-1 bg-black" />
                <span className="hidden sm:inline-flex bg-[#E10600] text-white px-2 py-1 text-[9px] font-mono-omni tracking-[0.2em]">SECTION {g.channelName.toUpperCase()}</span>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {g.items.map((v, i) => {
                  const actualizar = (actualizada: ContentVariant) => {
                    setVariantes((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)))
                    actualizarVariante(ideaActualId, actualizada)
                  }
                  return <VarianteCard key={v.id} variante={v} canalNombre={g.channelName} canalSlug={g.slug} index={i} onCambio={actualizar} />
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
