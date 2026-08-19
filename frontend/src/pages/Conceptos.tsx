// Vista "Conceptos": genera y muestra ideas de contenido por plataforma
// (TikTok/Instagram/Facebook) a partir de una idea. El usuario elige un
// concepto ("Usar esta idea") para la fase posterior (generar ContentVariant).
import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, type ContentConcept } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'

function ConceptoCard({
  concepto,
  canalNombre,
  seleccionando,
  onSeleccionar,
}: {
  concepto: ContentConcept
  canalNombre: string
  seleccionando: boolean
  onSeleccionar: (id: number) => void
}) {
  const [expandido, setExpandido] = useState(false)

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition-colors sm:p-5 ${
        concepto.seleccionado ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{concepto.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {canalNombre}
            </span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {concepto.format}
            </span>
            {concepto.objective && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {concepto.objective}
              </span>
            )}
            {concepto.estimated_duration != null && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {concepto.estimated_duration}s
              </span>
            )}
          </div>
        </div>

        {concepto.seleccionado && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            <span aria-hidden>✓</span> Concepto seleccionado
          </span>
        )}
      </header>

      {concepto.hook && (
        <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
          “{concepto.hook}”
        </p>
      )}

      {expandido && (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-600">
          {concepto.description && <p>{concepto.description}</p>}
          {concepto.target_audience && (
            <p>
              <span className="font-medium text-slate-700">Audiencia:</span> {concepto.target_audience}
            </p>
          )}
          {concepto.call_to_action && (
            <p>
              <span className="font-medium text-slate-700">CTA:</span> {concepto.call_to_action}
            </p>
          )}
          {concepto.rationale && (
            <p>
              <span className="font-medium text-slate-700">Por qué:</span> {concepto.rationale}
            </p>
          )}
        </div>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSeleccionar(concepto.id)}
          disabled={seleccionando || concepto.seleccionado}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {concepto.seleccionado ? 'Seleccionado' : 'Usar esta idea'}
        </button>
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {expandido ? 'Ocultar detalles' : 'Ver detalles'}
        </button>
      </footer>
    </article>
  )
}

export function Conceptos() {
  const { ideaActualId, ideas, navegar } = useApp()
  const idea = useMemo(() => ideas.find((i) => i.id === ideaActualId), [ideas, ideaActualId])

  const [conceptos, setConceptos] = useState<ContentConcept[]>([])
  const [cargando, setCargando] = useState(true)
  const [generando, setGenerando] = useState(false)
  const [seleccionandoId, setSeleccionandoId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    if (ideaActualId === null) return
    setCargando(true)
    setError(null)
    api
      .getContentConcepts(ideaActualId)
      .then(setConceptos)
      .catch((e: unknown) =>
        setError(e instanceof ApiError ? e.message : 'No se pudieron cargar los conceptos.'),
      )
      .finally(() => setCargando(false))
  }, [ideaActualId])

  useEffect(cargar, [cargar])

  const generar = async () => {
    if (ideaActualId === null) return
    setGenerando(true)
    setError(null)
    try {
      const resultado = await api.generateContentConcepts(ideaActualId)
      setConceptos(resultado.concepts)
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(`No se pudieron generar las ideas de contenido: ${e.message}`)
      } else {
        setError('No se pudieron generar las ideas de contenido.')
      }
    } finally {
      setGenerando(false)
    }
  }

  const seleccionar = async (conceptoId: number) => {
    setSeleccionandoId(conceptoId)
    setError(null)
    try {
      const seleccionado = await api.selectContentConcept(conceptoId)
      setConceptos((prev) =>
        prev.map((c) => ({ ...c, seleccionado: c.id === seleccionado.id })),
      )
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'No se pudo seleccionar el concepto.')
    } finally {
      setSeleccionandoId(null)
    }
  }

  const nombreCanal = useCallback(
    (canalId: number) => {
      const canal = idea?.canales.find((c) => c.id === canalId)
      return canal ? canal.nombre : `Canal #${canalId}`
    },
    [idea],
  )

  const grupos = useMemo(() => {
    const mapa = new Map<number, ContentConcept[]>()
    for (const c of conceptos) {
      const lista = mapa.get(c.canal_id) ?? []
      lista.push(c)
      mapa.set(c.canal_id, lista)
    }
    return [...mapa.entries()]
  }, [conceptos])

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

  const haySociales = (idea?.canales ?? []).some((c) =>
    ['tiktok', 'instagram', 'facebook'].includes(c.slug),
  )

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
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Ideas de contenido</h1>
        {idea ? (
          <p className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600 shadow-sm">
            <span className="font-semibold text-slate-800">Premisa:</span> {idea.premisa}
            <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              tono: {idea.tono}
            </span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-700">
            Idea #{ideaActualId} no encontrada en el catálogo local — se muestran los conceptos del
            backend igualmente.
          </p>
        )}
      </header>

      {!haySociales && !cargando && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Esta idea no tiene canales sociales (TikTok/Instagram/Facebook) seleccionados, así que no
          hay conceptos que generar por plataforma.
        </div>
      )}

      {haySociales && (
        <button
          type="button"
          onClick={generar}
          disabled={generando}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generando ? 'Generando ideas…' : conceptos.length > 0 ? 'Regenerar ideas de contenido' : 'Generar ideas de contenido'}
        </button>
      )}

      {error && <ErrorAlert mensaje={error} />}

      {cargando ? (
        <Loading mensaje="Cargando conceptos…" />
      ) : generando ? (
        <Loading mensaje="Gemini está pensando ideas para cada plataforma…" />
      ) : conceptos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Todavía no hay conceptos generados. Presioná “Generar ideas de contenido”.
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(([canalId, lista]) => (
            <section key={canalId}>
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-800">
                {nombreCanal(canalId)}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {lista.length}
                </span>
              </h2>
              <div className="space-y-3">
                {lista.map((c) => (
                  <ConceptoCard
                    key={c.id}
                    concepto={c}
                    canalNombre={nombreCanal(c.canal_id)}
                    seleccionando={seleccionandoId === c.id}
                    onSeleccionar={seleccionar}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => navegar('variantes', ideaActualId)}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          Ver variantes de los canales legacy →
        </button>
      </div>
    </div>
  )
}
