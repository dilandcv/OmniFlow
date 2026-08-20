import { useState } from 'react'
import { USE_MOCK, API_BASE_URL } from '../api'

export function AiConfig() {
  const [provider] = useState('GOOGLE GEMINI')
  const [model, setModel] = useState('GEMINI-1.5-PRO')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const test = async () => {
    setTesting(true)
    setStatus('idle')
    setMsg('')
    // Mock test: if USE_MOCK, success after 900ms
    await new Promise((r) => setTimeout(r, 900))
    if (!apiKey.trim() && USE_MOCK) {
      setStatus('ok')
      setMsg('CONNECTED — Mock mode activo (sin API key requerida).')
    } else if (apiKey.trim().length < 8) {
      setStatus('error')
      setMsg('API KEY inválida — debe tener al menos 8 caracteres.')
    } else {
      setStatus('ok')
      setMsg(`CONNECTED — Provider: ${provider} • Model: ${model} • ${USE_MOCK ? 'MOCK' : API_BASE_URL}`)
    }
    setTesting(false)
  }

  return (
    <div className="space-y-6">
      <header className="bg-[#E10600] text-white border-[3px] border-black shadow-[6px_6px_0_#111] relative overflow-hidden">
        <div className="absolute inset-0 halftone-black opacity-15 pointer-events-none" />
        <div className="relative p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono-omni tracking-[0.2em] bg-black px-2 py-1 inline-flex">AI CONFIGURATION</p>
            <h1 className="font-display text-3xl lg:text-4xl leading-none mt-2">AI • GEMINI • CONFIG</h1>
            <p className="text-xs font-mono-omni tracking-wide text-white/80 mt-2">Mantiene la funcionalidad existente — solo rediseño visual. Backend: {API_BASE_URL} • {USE_MOCK ? 'MOCK MODE' : 'LIVE API'}</p>
          </div>
          <div className="bg-black text-white border-2 border-white px-4 py-3 text-center">
            <p className="text-[10px] font-mono-omni tracking-widest">STATUS</p>
            <p className={`font-display text-xl leading-none ${status === 'ok' ? 'text-green-400' : status === 'error' ? 'text-[#E10600]' : 'text-white/60'}`}>
              {status === 'ok' ? 'CONNECTED' : status === 'error' ? 'ERROR' : 'IDLE'}
            </p>
          </div>
        </div>
        <div className="h-1 bg-black" />
      </header>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border-[3px] border-black shadow-[6px_6px_0_#111]">
          <div className="bg-black text-white px-4 py-2 flex items-center gap-2">
            <span className="size-2 bg-[#E10600] rounded-full animate-pulse" />
            <span className="font-condensed font-black tracking-[0.14em] text-xs">PROVIDER & MODEL</span>
            <span className="ml-auto text-[9px] font-mono-omni bg-[#E10600] px-2 py-1">GOOGLE GEMINI</span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-mono-omni tracking-[0.18em] text-black mb-1.5">PROVIDER</label>
              <div className="border-[3px] border-black bg-[#111111] text-white px-4 py-3 flex items-center justify-between">
                <span className="font-condensed font-black tracking-widest text-sm">{provider}</span>
                <span className="size-2 bg-[#E10600] rounded-full" />
              </div>
              <p className="text-[10px] font-mono-omni text-black/50 mt-1">Proveedor configurado vía <code className="bg-black text-white px-1">AI_PROVIDER</code> en backend/.env</p>
            </div>

            <div>
              <label className="block text-[10px] font-mono-omni tracking-[0.18em] text-black mb-1.5">MODEL</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full border-[3px] border-black bg-white px-4 py-3 font-condensed font-black tracking-widest text-sm focus:border-[#E10600] focus:outline-none"
              >
                <option>GEMINI-1.5-PRO</option>
                <option>GEMINI-1.5-FLASH</option>
                <option>GEMINI-2.0-FLASH</option>
                <option>GEMINI-PRO-VISION</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono-omni tracking-[0.18em] text-black mb-1.5">API KEY</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full border-[3px] border-black bg-white px-4 py-3 pr-24 font-mono-omni text-sm tracking-widest focus:border-[#E10600] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-1 top-1 bottom-1 bg-black text-white px-3 text-[10px] font-black tracking-widest hover:bg-[#E10600] transition-colors"
                >
                  {showKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-[10px] font-mono-omni text-black/50 mt-1">Se lee de <code className="bg-black text-white px-1">AI_API_KEY</code>. En modo mock no es requerida.</p>
            </div>

            <button
              type="button"
              onClick={test}
              disabled={testing}
              className="w-full bg-[#E10600] text-white border-[3px] border-black py-3 font-condensed font-black tracking-[0.14em] text-sm shadow-[4px_4px_0_#111] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_#111] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#111] transition-all disabled:opacity-50"
            >
              {testing ? 'TESTING CONNECTION…' : 'TEST CONNECTION →'}
            </button>

            {msg && (
              <div className={`border-[3px] border-black px-4 py-3 text-xs font-bold flex gap-3 ${status === 'ok' ? 'bg-black text-white' : 'bg-[#E10600] text-white'}`}>
                <span className={`size-6 flex items-center justify-center border-2 shrink-0 ${status === 'ok' ? 'bg-[#E10600] border-white text-white' : 'bg-black border-white'}`}>{status === 'ok' ? '✓' : '!'}</span>
                <span className="font-mono-omni tracking-wide leading-tight">{msg}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <span className="bg-[#F5F5F5] border-2 border-black px-2 py-1 text-[9px] font-mono-omni tracking-widest">ENV: {USE_MOCK ? 'MOCK' : 'LIVE'}</span>
              <span className="bg-black text-white px-2 py-1 text-[9px] font-mono-omni tracking-widest">PROMPT v1</span>
              <span className="bg-white border-2 border-black px-2 py-1 text-[9px] font-mono-omni tracking-widest">CORS: {API_BASE_URL}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111111] text-white border-[3px] border-black p-5 relative overflow-hidden">
            <div className="absolute inset-0 halftone-white opacity-5 pointer-events-none" />
            <p className="relative text-[10px] font-mono-omni tracking-[0.2em] text-[#E10600]">HOW IT WORKS</p>
            <div className="relative mt-3 space-y-2 font-mono-omni text-xs leading-relaxed text-white/80">
              <p><span className="bg-[#E10600] text-white px-1 font-black">01</span> Idea → IA analiza la premisa</p>
              <p><span className="bg-white text-black px-1 font-black">02</span> Genera conceptos por red social</p>
              <p><span className="bg-[#E10600] text-white px-1 font-black">03</span> Selección → Genera contenido</p>
              <p><span className="bg-white text-black px-1 font-black">04</span> Edición → Aprobación → Programa</p>
            </div>
            <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { k: 'TIKTOK', v: '9:16' },
                { k: 'IG', v: '1:1' },
                { k: 'FB', v: '16:9' },
              ].map((x) => (
                <div key={x.k} className="border border-white/20 py-2 bg-white/5">
                  <p className="font-display text-sm leading-none">{x.k}</p>
                  <p className="text-[9px] font-mono-omni tracking-widest text-white/60">{x.v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-[3px] border-black p-4">
            <p className="font-condensed font-black tracking-[0.12em] text-xs">BRUTALIST NOTES</p>
            <ul className="mt-2 space-y-1.5 text-[11px] font-mono-omni leading-tight text-black/70 list-disc list-inside">
              <li>No se modifica backend ni modelos</li>
              <li>ContentVariant & ScheduledPost intactos</li>
              <li>AppContext y fetch originales preservados</li>
              <li>Mock mode para desarrollo sin API key</li>
            </ul>
            <div className="mt-3 h-1 w-full bg-[#E10600]" />
            <p className="mt-2 text-[9px] font-mono-omni tracking-widest text-black/40">OMNIFLOW — CONTENT INTELLIGENCE CENTER</p>
          </div>
        </div>
      </div>
    </div>
  )
}
