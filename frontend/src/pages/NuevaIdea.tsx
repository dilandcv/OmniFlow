// Vista "Nueva idea": formulario de premisa + tono + canales. Al enviar crea
// la idea (el backend genera variantes solo para canales legacy) y navega a la
// vista de conceptos, donde se generan las ideas de contenido por plataforma.
import { useEffect, useState } from 'react'
import { api, ApiError, TONOS, type Channel } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'

export function NuevaIdea() {
  const { navegar, guardarIdea } = useApp()

  const [canales, setCanales] = useState<Channel[]>([])
  const [canalesCargando, setCanalesCargando] = useState(true)
  const [errorCanales, setErrorCanales] = useState<string | null>(null)

  const [premisa, setPremisa] = useState('')
  const [tono, setTono] = useState<string>(TONOS[0])
  const [canalIds, setCanalIds] = useState<number[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cargarCanales = () => {
    setCanalesCargando(true)
    setErrorCanales(null)
    api
      .listarCanales()
      .then((c) => setCanales(c))
      .catch((e: unknown) => setErrorCanales(e instanceof Error ? e.message : 'No se pudieron cargar los canales.'))
      .finally(() => setCanalesCargando(false))
  }

  useEffect(cargarCanales, [])

  const toggleCanal = (id: number) => {
    setCanalIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const premisaLimpia = premisa.trim()
    if (premisaLimpia.length < 3) {
      setError('Escribí una premisa de al menos 3 caracteres.')
      return
    }
    if (canalIds.length === 0) {
      setError('Seleccioná al menos un canal.')
      return
    }

    setEnviando(true)
    try {
      const idea = await api.crearIdea({ premisa: premisaLimpia, tono, canal_ids: canalIds })
      guardarIdea(idea)
      navegar('conceptos', idea.id)
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setError(`No se pudo generar el contenido: ${e.message}. Intentá de nuevo.`)
      } else {
        setError('No se pudo generar el contenido. Intentá de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Nueva idea</h1>
      <p className="mt-1 text-sm text-slate-500">
        Convertí una premisa en ideas de contenido para cada plataforma social.
      </p>

      {errorCanales ? (
        <div className="mt-4">
          <ErrorAlert mensaje={errorCanales} onReintentar={cargarCanales} />
        </div>
      ) : null}

      {canalesCargando ? (
        <Loading mensaje="Cargando canales…" />
      ) : (
        <form onSubmit={enviar} className="mt-6 space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            <label htmlFor="premisa" className="mb-1.5 block text-sm font-medium text-slate-700">
              Premisa / idea
            </label>
            <textarea
              id="premisa"
              value={premisa}
              onChange={(e) => setPremisa(e.target.value)}
              rows={4}
              placeholder="Ej.: Por qué los creadores deberían usar IA para escalar sus contenidos…"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label htmlFor="tono" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tono
            </label>
            <select
              id="tono"
              value={tono}
              onChange={(e) => setTono(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {TONOS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Canales</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {canales.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    canalIds.includes(c.id)
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={canalIds.includes(c.id)}
                    onChange={() => toggleCanal(c.id)}
                    className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium">{c.nombre}</span>
                </label>
              ))}
            </div>
            {canales.length === 0 && !canalesCargando && (
              <p className="text-sm text-slate-500">No hay canales disponibles todavía.</p>
            )}
          </fieldset>

          {error && <ErrorAlert mensaje={error} />}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              {canales.length > 0
                ? `${canales.length} canales disponibles · ${TONOS.length} tonos`
                : 'Sin canales disponibles'}
            </p>
            <button
              type="submit"
              disabled={enviando || canalesCargando}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Creando…' : 'Crear idea'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}