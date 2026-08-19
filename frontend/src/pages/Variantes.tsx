// Vista "Variantes generadas": lista las variantes por canal de una idea,
// permite editar el texto en línea y aprobar/rechazar cada una. Refleja el
// estado (borrador/aprobado/programado/publicado) visualmente.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type ContentVariant } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'
import { EstadoBadge } from '../components/EstadoBadge'

function VarianteCard({
  variante,
  canalNombre,
  onCambio,
}: {
  variante: ContentVariant
  canalNombre: string
  onCambio: (actualizada: ContentVariant) => void
}) {
  const [texto, setTexto] = useState(variante.contenido)
  const [guardando, setGuardando] = useState(false)
  const [animando, setAnimando] = useState(false)
  const [mostrarMotivo, setMostrarMotivo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Sincroniza el textarea si el contenido cambia desde el backend.
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

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition-colors sm:p-5 ${
        esRechazada
          ? 'border-rose-200 opacity-80'
          : variante.estado === 'aprobado'
            ? 'border-emerald-300 ring-1 ring-emerald-200'
            : variante.estado === 'programado'
              ? 'border-indigo-300 ring-1 ring-indigo-200'
              : variante.estado === 'publicado'
                ? 'border-sky-300 ring-1 ring-sky-200'
                : 'border-slate-200'
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{canalNombre}</span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
            {variante.formato}
          </span>
        </div>
        <EstadoBadge estado={variante.estado} />
      </header>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        readOnly={!esBorrador}
        rows={6}
        className={`mt-3 w-full rounded-lg border bg-white px-3 py-2 text-sm leading-relaxed shadow-sm focus:outline-none focus:ring-2 ${
          esBorrador
            ? 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
            : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-600'
        }`}
      />

      {esRechazada && variante.motivo_rechazo && (
        <p className="mt-2 rounded-md bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
          Motivo del rechazo: {variante.motivo_rechazo}
        </p>
      )}

      {error && <div className="mt-2"><ErrorAlert mensaje={error} /></div>}

      {esBorrador && (
        <footer className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || !hayCambios}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={aprobar}
            disabled={animando}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {animando ? '…' : 'Aprobar'}
          </button>

          <button
            type="button"
            onClick={() => setMostrarMotivo((v) => !v)}
            disabled={animando}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            {mostrarMotivo ? 'Cancelar' : 'Rechazar'}
          </button>

          {mostrarMotivo && (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo del rechazo (opcional)"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
              <button
                type="button"
                onClick={rechazar}
                disabled={animando}
                className="shrink-0 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                {animando ? '…' : 'Confirmar rechazo'}
              </button>
            </div>
          )}
        </footer>
      )}

      <footer className="mt-3 text-xs text-slate-400">
        Actualizada: {variante.fecha_actualizacion}
      </footer>
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
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las variantes.'),
      )
      .finally(() => setCargando(false))
  }, [ideaActualId])

  useEffect(cargar, [cargar])

  if (ideaActualId === null) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Aún no hay una idea seleccionada.</p>
        <button
          type="button"
          onClick={() => navegar('idea')}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Crear una nueva idea
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <button
          type="button"
          onClick={() => navegar('idea')}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          ← Nueva idea
        </button>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Variantes generadas</h1>
        {idea ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
            <span className="font-semibold text-slate-800">Premisa:</span> {idea.premisa}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              tono: {idea.tono}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            Idea #{ideaActualId} no encontrada en el catálogo local — se muestran las variantes del
            backend igualmente.
          </p>
        )}
      </header>

      {error && <ErrorAlert mensaje={error} onReintentar={cargar} />}
      {cargando ? (
        <Loading mensaje="Cargando variantes…" />
      ) : variantes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Esta idea aún no tiene variantes generadas.
        </div>
      ) : (
        <div className="space-y-4">
          {variantes.map((v) => {
            const canal = idea?.canales.find((c) => c.id === v.canal_id)
            const canalNombre = canal ? canal.nombre : `Canal #${v.canal_id}`
            const actualizar = (actualizada: ContentVariant) => {
              setVariantes((prev) => prev.map((p) => (p.id === actualizada.id ? actualizada : p)))
              actualizarVariante(ideaActualId, actualizada)
            }
            return (
              <VarianteCard
                key={v.id}
                variante={v}
                canalNombre={canalNombre}
                onCambio={actualizar}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}