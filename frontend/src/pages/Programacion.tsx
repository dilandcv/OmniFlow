// Vista "Programación": lista las variantes aprobadas para elegir fecha/hora y
// programarlas, y muestra una lista simple de lo ya programado con su estado
// (pendiente/programado → publicado).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type ContentVariant, type ScheduledPost } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'
import { EstadoBadge } from '../components/EstadoBadge'
import { formatFecha, fromDateTimeLocal, minutoLocal } from '../lib/datetime'

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
    // Lista simple agrupada por día de publicación.
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
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Programación</h1>
        <p className="mt-1 text-sm text-slate-500">
          Programá variantes aprobadas y seguí el estado de publicación.
        </p>
      </header>

      {accionError && <ErrorAlert mensaje={accionError} />}
      {error && <ErrorAlert mensaje={error} onReintentar={cargar} />}

      {/* Variantes aprobadas listas para programar */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800">Variantes aprobadas</h2>
        {aprobadas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No hay variantes aprobadas. Aprobá variantes desde la vista “Variantes”.
          </div>
        ) : (
          <div className="space-y-3">
            {aprobadas.map((v) => {
              const canal = canalDe(v.id)
              return (
                <div
                  key={v.id}
                  className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{canal}</p>
                      <p className="text-xs text-slate-500">
                        Variante #{v.id} · {v.formato}
                      </p>
                    </div>
                    <EstadoBadge estado={v.estado} />
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="datetime-local"
                      value={fechas[v.id] ?? ''}
                      onChange={(e) => setFechas((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 sm:max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => programar(v)}
                      disabled={programandoId === v.id}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {programandoId === v.id ? 'Programando…' : 'Programar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Agenda: lo ya programado */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800">Programadas</h2>
        {cargando ? (
          <Loading mensaje="Cargando programaciones…" />
        ) : grupos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            Aún no hay publicaciones programadas.
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map(([dia, posts]) => (
              <div key={dia} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {formatFecha(`${dia}T00:00:00`)}
                </div>
                <ul className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {String(canalDe(p.variante_id))} · Variante #{p.variante_id}
                        </p>
                        <p className="text-xs text-slate-500">{formatFecha(p.programado_para)}</p>
                        {p.fecha_publicacion && (
                          <p className="text-xs text-emerald-700">
                            Publicada el {formatFecha(p.fecha_publicacion)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <EstadoBadge estado={p.estado} />
                        {p.estado !== 'publicado' && (
                          <button
                            type="button"
                            onClick={() => cancelar(p)}
                            disabled={cancelandoId === p.id}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                          >
                            {cancelandoId === p.id ? '…' : 'Cancelar'}
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