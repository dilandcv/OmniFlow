// Visita "Configuración de IA": proveedor + API key + modelo opcional.
// La API key SOLO se guarda en memoria del backend (app/ai/runtime.py) y del
// mock de sesión; jamás se persiste ni se expone en respuestas. Se pierde al
// reiniciar el backend o al recargar la página (comportamiento esperado).
import { useState } from 'react'
import { api, type AIConnectionResult, type ProveedorIA } from '../api'
import { useApp } from '../state/AppContext'
import { ErrorAlert } from '../components/ErrorAlert'

interface ProveedorInfo {
  valor: ProveedorIA
  etiqueta: string
  modeloSugerido: string
}

const PROVEEDORES: ProveedorInfo[] = [
  { valor: 'gemini', etiqueta: 'Gemini (Google)', modeloSugerido: 'gemini-2.5-flash' },
  { valor: 'anthropic', etiqueta: 'Anthropic (Claude)', modeloSugerido: 'claude-3-5-sonnet-latest' },
  { valor: 'openai', etiqueta: 'OpenAI (GPT)', modeloSugerido: 'gpt-4o-mini' },
]

const estilosCampo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

export function ConfiguracionIA() {
  const { aiStatus, actualizarAIStatus } = useApp()

  const [provider, setProvider] = useState<ProveedorIA>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [verClave, setVerClave] = useState(false)

  const [probando, setProbando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [testOK, setTestOK] = useState<AIConnectionResult | null>(null)

  const proveedorInfo = PROVEEDORES.find((p) => p.valor === provider) ?? PROVEEDORES[0]

  const validar = (): boolean => {
    const key = apiKey.trim()
    if (!key) {
      setError('Escribí la API key del proveedor.')
      return false
    }
    return true
  }

  const probarConexion = async () => {
    setError(null)
    setMensaje(null)
    setTestOK(null)
    if (!validar()) return
    setProbando(true)
    try {
      const resultado = await api.testAIConnection({
        provider,
        api_key: apiKey.trim(),
        model: model.trim() || undefined,
      })
      setTestOK(resultado)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo probar la conexión.')
    } finally {
      setProbando(false)
    }
  }

  const guardar = async () => {
    setError(null)
    setMensaje(null)
    setTestOK(null)
    if (!validar()) return
    setGuardando(true)
    try {
      const estado = await api.configureAI({
        provider,
        api_key: apiKey.trim(),
        model: model.trim() || undefined,
      })
      actualizarAIStatus(estado)
      setMensaje('Configuración guardada en memoria. La API key se pierde al reiniciar el backend.')
      setApiKey('') // no retener la clave en el formulario
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la configuración.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async () => {
    setError(null)
    setMensaje(null)
    setTestOK(null)
    setGuardando(true)
    try {
      const estado = await api.clearAIConfiguration()
      actualizarAIStatus(estado)
      setMensaje('Configuración de IA eliminada de la memoria.')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la configuración.')
    } finally {
      setGuardando(false)
    }
  }

  const cambioProveedor = (valor: string) => {
    const p = valor as ProveedorIA
    setProvider(p)
    setModel('')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Configuración de IA</h1>
      <p className="mt-1 text-sm text-slate-500">
        Conectá el backend con un proveedor de IA para generar variantes en “Nueva idea”.
      </p>

      <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Seguridad: la API key no se persiste.</p>
        <p className="mt-1">
          La clave vive solo en la memoria del backend (nunca en la base de datos, en
          localStorage ni en logs) y se pierde si el backend se reinicia. No se envía de
          vuelta al navegador en ninguna respuesta.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-700">Estado actual</h2>
          {aiStatus.configured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <span aria-hidden className="size-2 rounded-full bg-emerald-500" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              <span aria-hidden className="size-2 rounded-full bg-slate-400" />
              Sin configurar
            </span>
          )}
        </div>

        <p className="mt-3 text-sm text-slate-600">
          {aiStatus.configured ? (
            <>
              Proveedor activo: <span className="font-medium">{aiStatus.provider}</span> · Modelo:{' '}
              <span className="font-medium">{aiStatus.model}</span>
            </>
          ) : (
            'No hay proveedor de IA activo. Configurá uno abajo para poder generar variantes.'
          )}
        </p>

        {aiStatus.configured && (
          <button
            type="button"
            onClick={eliminar}
            disabled={guardando}
            className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Eliminando…' : 'Eliminar configuración'}
          </button>
        )}
      </div>

      <div className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label htmlFor="provider" className="mb-1.5 block text-sm font-medium text-slate-700">
            Proveedor
          </label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => cambioProveedor(e.target.value)}
            className={estilosCampo}
          >
            {PROVEEDORES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="api_key" className="mb-1.5 block text-sm font-medium text-slate-700">
            API key
          </label>
          <div className="flex gap-2">
            <input
              id="api_key"
              type={verClave ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              placeholder="Pegá tu API key aquí…"
              className={estilosCampo}
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              title={verClave ? 'Ocultar clave' : 'Mostrar clave'}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              {verClave ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="model" className="mb-1.5 block text-sm font-medium text-slate-700">
            Modelo <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <input
            id="model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={`Vacío = ${proveedorInfo.modeloSugerido}`}
            className={estilosCampo}
          />
        </div>

        {error && <ErrorAlert mensaje={error} />}

        {testOK && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800">
            <span aria-hidden>✅</span>
            <div>
              <p className="font-medium">Conexión correcta.</p>
              <p>{testOK.message}</p>
            </div>
          </div>
        )}

        {mensaje && (
          <div className="rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-sm text-indigo-800">
            {mensaje}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={probarConexion}
            disabled={probando || guardando}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {probando ? 'Probando…' : 'Probar conexión'}
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando || probando || !apiKey.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}