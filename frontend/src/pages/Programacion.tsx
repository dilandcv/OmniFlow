// Vista "Programación": editorial calendar con estilo comic
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type ContentVariant, type ScheduledPost } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'
import { EstadoBadge } from '../components/EstadoBadge'
import { formatFecha, fromDateTimeLocal, minutoLocal } from '../lib/datetime'
import { IconCalendar } from '../components/graphics/OmniIcons'

function porDefecto(hora: Date): string {
  return minutoLocal(new Date(hora.getTime() + 60 * 60 * 1000))
}

export function Programacion() {
  const { ideas, actualizarVariante } = useApp()

  const [programaciones, setProgramaciones] = useState<ScheduledPost[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fechas, setFechas] = useState<Record<number, string>>({})
  const [programandoId, setProgramandoId] = useState<number | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)
  const [accionError, setAccionError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    setCargando(true)
    setError(null)
    api
      .listarProgramaciones()
      .then(setProgramaciones)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las programaciones.'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
    setFechas((prev) => {
      if (Object.keys(prev).length > 0) return prev
      const primera = new Date()
      const base = porDefecto(primera)
      const c = { ...prev }
      for (const idea of ideas) {
        for (const v of idea.variantes) {
          if (v.estado === 'aprobado' && c[v.id] === undefined) c[v.id] = base
        }
      }
      return c
    })
  }, [cargar, ideas])

  const aprobadas = useMemo(
    () => ideas.flatMap((idea) => idea.variantes.filter((v) => v.estado === 'aprobado')),
    [ideas],
  )

  const canalDe = useCallback(
    (varianteId: number) => {
      for (const idea of ideas) {
        const variante = idea.variantes.find((v) => v.id === varianteId)
        if (variante) {
          const canal = idea.canales.find((c) => c.id === variante.canal_id)
          return canal ? canal.nombre : `Canal #${variante.canal_id}`
        }
      }
      return `Variante #${varianteId}`
    },
    [ideas],
  )

  const programar = async (v: ContentVariant) => {
    setAccionError(null)
    const raw = fechas[v.id]
    if (!raw) {
      setAccionError('Elegí una fecha y hora para programar.')
      return
    }
    setProgramandoId(v.id)
    try {
      await api.programarVariante({ variante_id: v.id, programado_para: fromDateTimeLocal(raw) })
      const idea = ideas.find((i) => i.id === v.idea_id)
      if (idea) actualizarVariante(idea.id, { ...v, estado: 'programado' })
      cargar()
    } catch (e: unknown) {
      setAccionError(e instanceof ApiError ? e.message : 'No se pudo programar la variante.')
    } finally {
      setProgramandoId(null)
    }
  }

  const cancelar = async (post: ScheduledPost) => {
    setAccionError(null)
    setCancelandoId(post.id)
    try {
      await api.cancelarProgramacion(post.id)
      const variante = ideas.flatMap((i) => i.variantes).find((x) => x.id === post.variante_id)
      if (variante) actualizarVariante(variante.idea_id, { ...variante, estado: 'aprobado' })
      cargar()
    } catch (e: unknown) {
      setAccionError(e instanceof ApiError ? e.message : 'No se pudo cancelar la programación.')
    } finally {
      setCancelandoId(null)
    }
  }

  const grupos = useMemo(() => {
    const mapa = new Map<string, ScheduledPost[]>()
    for (const p of programaciones) {
      const dia = (p.programado_para ?? '').slice(0, 10)
      const lista = mapa.get(dia) ?? []
      lista.push(p)
      mapa.set(dia, lista)
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [programaciones])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-[#111111] text-white border-[3px] border-black shadow-[6px_6px_0_#111] relative overflow-hidden">
        <div className="absolute inset-0 halftone-white opacity-[0.05] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-[#E10600]" />
        <div className="relative p-5 lg:p-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#E10600] text-white px-2 py-1 text-[10px] font-black tracking-[0.2em] font-mono-omni flex items-center gap-1.5"><IconCalendar size={12} /> SCHEDULE</span>
              <span className="text-[10px] font-mono-omni tracking-[0.18em] text-white/50">CALENDAR • EDITORIAL GRID</span>
            </div>
            <h1 className="font-display text-4xl leading-none">
              PROGRAMA<span className="text-[#E10600]">CIÓN</span>
            </h1>
            <p className="mt-2 text-sm text-white/60 max-w-xl border-l-2 border-[#E10600] pl-3">Programá variantes aprobadas y seguí el estado de publicación. Todo lo programado aparece en la agenda.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="bg-white text-black border-2 border-white px-4 py-2 text-center">
              <p className="font-display text-2xl leading-none">{aprobadas.length}</p>
              <p className="text-[8px] font-mono-omni tracking-widest">READY TO SHIP</p>
            </div>
            <div className="bg-[#E10600] text-white border-2 border-[#E10600] px-4 py-2 text-center">
              <p className="font-display text-2xl leading-none">{programaciones.length}</p>
              <p className="text-[8px] font-mono-omni tracking-widest">SCHEDULED</p>
            </div>
          </div>
        </div>
        <div className="h-2 bg-[#E10600] relative overflow-hidden"><div className="absolute inset-0 halftone-black opacity-15" /></div>
      </header>

      {accionError && <ErrorAlert mensaje={accionError} />}
      {error && <ErrorAlert mensaje={error} onReintentar={cargar} />}

      {/* Variantes aprobadas */}
      <section className="bg-white border-[3px] border-black shadow-[6px_6px_0_#111] overflow-hidden">
        <div className="bg-black text-white px-4 py-2 flex items-center gap-3 border-b-[3px] border-black">
          <span className="size-7 bg-[#E10600] text-white flex items-center justify-center font-black text-xs border border-white">✓</span>
          <h2 className="font-condensed font-black tracking-[0.14em] text-sm">VARIANTES APROBADAS — READY TO SCHEDULE</h2>
          <span className="ml-auto hidden sm:inline-flex bg-white text-black px-2 py-1 text-[10px] font-mono-omni font-black">{aprobadas.length} ITEMS</span>
        </div>
        {aprobadas.length === 0 ? (
          <div className="p-8 text-center bg-[#F5F5F5] border-t-2 border-dashed border-black/20">
            <p className="font-display text-xl">NO APPROVED VARIANTS</p>
            <p className="text-sm font-mono-omni text-black/50 mt-1">Aprobá variantes desde la vista “Concepts”.</p>
            <div className="mt-4 h-1 w-20 bg-[#E10600] mx-auto" />
          </div>
        ) : (
          <div className="p-4 grid md:grid-cols-2 gap-4 bg-[#F5F5F5]">
            {aprobadas.map((v) => {
              const canal = canalDe(v.id)
              return (
                <div key={v.id} className="bg-white border-[3px] border-black p-4 relative shadow-[4px_4px_0_#111] hover:shadow-[6px_6px_0_#111] transition-shadow">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#E10600]" />
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="font-condensed font-black text-xs tracking-[0.1em]">{canal.toUpperCase()}</p>
                      <p className="text-[10px] font-mono-omni text-black/50">VARIANTE #{v.id} • {v.formato.toUpperCase()}</p>
                    </div>
                    <EstadoBadge estado={v.estado} />
                  </div>
                  <p className="text-xs leading-relaxed bg-[#F5F5F5] border-2 border-black p-2 line-clamp-2">{v.contenido.slice(0, 120)}…</p>
                  <div className="mt-3 flex gap-2">
                    <input
                      type="datetime-local"
                      value={fechas[v.id] ?? ''}
                      onChange={(e) => setFechas((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      className="flex-1 border-2 border-black px-3 py-2 text-xs font-mono-omni focus:border-[#E10600] focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => programar(v)}
                      disabled={programandoId === v.id}
                      className="bg-[#E10600] text-white border-2 border-black px-4 py-2 text-xs font-black tracking-widest hover:bg-black disabled:opacity-50 shadow-[2px_2px_0_#111]"
                    >
                      {programandoId === v.id ? '…' : 'PROGRAMAR'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Agenda */}
      <section className="bg-white border-[3px] border-black shadow-[6px_6px_0_#111] overflow-hidden">
        <div className="bg-[#E10600] text-white px-4 py-2 flex items-center gap-3 border-b-[3px] border-black relative">
          <div className="absolute inset-0 halftone-black opacity-15 pointer-events-none" />
          <span className="relative size-7 bg-black text-white flex items-center justify-center font-black text-xs border-2 border-white">◉</span>
          <h2 className="relative font-condensed font-black tracking-[0.14em] text-sm">AGENDA — PROGRAMADAS</h2>
          <span className="relative ml-auto bg-black text-white px-2 py-1 text-[10px] font-mono-omni">{grupos.length} DAYS</span>
        </div>
        {cargando ? (
          <div className="p-6"><Loading mensaje="CARGANDO AGENDA…" /></div>
        ) : grupos.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-display text-2xl">NO SCHEDULED POSTS</p>
            <p className="text-xs font-mono-omni text-black/50 mt-1">Aún no hay publicaciones programadas.</p>
          </div>
        ) : (
          <div className="divide-y-[3px] divide-black">
            {grupos.map(([dia, posts]) => (
              <div key={dia} className="bg-[#F5F5F5]">
                <div className="bg-black text-white px-4 py-2 flex items-center gap-3">
                  <span className="bg-[#E10600] text-white px-2 py-1 text-xs font-black tracking-widest border border-white">{dia || 'SIN FECHA'}</span>
                  <span className="text-xs font-mono-omni tracking-widest text-white/70">{formatFecha(`${dia}T00:00:00`)}</span>
                  <span className="ml-auto text-[10px] font-mono-omni bg-white text-black px-2 py-0.5 font-black">{posts.length} POSTS</span>
                </div>
                <ul className="divide-y divide-black/10 bg-white">
                  {posts.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-[#F5F5F5] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black tracking-wide truncate">
                          <span className="bg-black text-white px-1.5 py-0.5 text-[10px] mr-2">{String(canalDe(p.variante_id)).toUpperCase()}</span>
                          VARIANTE #{p.variante_id}
                        </p>
                        <p className="text-xs font-mono-omni text-black/60 mt-1 flex items-center gap-2">
                          <span className="size-1.5 bg-[#E10600] rounded-full" /> {formatFecha(p.programado_para)}
                          {p.fecha_publicacion && <span className="bg-green-600 text-white px-1.5 py-0.5 text-[9px] font-black">PUBLISHED {formatFecha(p.fecha_publicacion)}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <EstadoBadge estado={p.estado} />
                        {p.estado !== 'publicado' && (
                          <button
                            type="button"
                            onClick={() => cancelar(p)}
                            disabled={cancelandoId === p.id}
                            className="border-2 border-black bg-white px-3 py-1 text-xs font-black tracking-widest hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            {cancelandoId === p.id ? '…' : 'CANCELAR'}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
