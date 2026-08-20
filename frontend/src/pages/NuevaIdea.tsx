// Vista "Nueva idea": formulario de premisa + tono + canales con diseño editorial comic
import { useEffect, useState } from 'react'
import { api, ApiError, TONOS, type Channel } from '../api'
import { useApp } from '../state/AppContext'
import { Loading } from '../components/Loading'
import { ErrorAlert } from '../components/ErrorAlert'
import { HeroIllustration } from '../components/graphics/HeroIllustration'
import { SplatterSmall, DiagonalBars } from '../components/graphics/Splatter'
import { IconBolt, IconSpark, IconTikTok, IconInstagram, IconFacebook } from '../components/graphics/OmniIcons'

const TONO_LABELS: Record<string, { label: string; desc: string }> = {
  neutral: { label: 'NEUTRAL', desc: 'Equilibrado' },
  divulgativo: { label: 'EDUCATIONAL', desc: 'Didáctico' },
  profesional: { label: 'SERIOUS', desc: 'Profesional' },
  humor: { label: 'FUNNY', desc: 'Humor' },
  motivacional: { label: 'INSPIRATIONAL', desc: 'Motivacional' },
}

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  tiktok: <IconTikTok size={18} />,
  instagram: <IconInstagram size={18} />,
  facebook: <IconFacebook size={18} />,
}

function ChannelMeta(slug: string) {
  const key = slug.toLowerCase()
  return CHANNEL_ICON[key] ?? <span className="font-display text-sm">{slug[0].toUpperCase()}</span>
}

export function NuevaIdea() {
  const { navegar, guardarIdea, ideas } = useApp()

  const [canales, setCanales] = useState<Channel[]>([])
  const [canalesCargando, setCanalesCargando] = useState(true)
  const [errorCanales, setErrorCanales] = useState<string | null>(null)

  const [premisa, setPremisa] = useState('')
  const [tono, setTono] = useState<string>(TONOS[0])
  const [canalIds, setCanalIds] = useState<number[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const stats = {
    ideas: ideas.length,
    variantes: ideas.reduce((acc, i) => acc + i.variantes.length, 0),
    scheduled: ideas.flatMap((i) => i.variantes).filter((v) => v.estado === 'programado' || v.estado === 'publicado').length,
  }

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
      navegar('variantes', idea.id)
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
    <div className="space-y-6">
      {/* HERO EDITORIAL */}
      <section className="relative bg-[#111111] text-white overflow-hidden border-[3px] border-black shadow-[8px_8px_0_#111]">
        {/* halftone + texture */}
        <div className="absolute inset-0 halftone-white opacity-[0.06]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `repeating-linear-gradient(-45deg, transparent 0 14px, rgba(225,6,0,0.2) 14px 15px)` }} />

        <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-0">
          {/* Left: Typography poster */}
          <div className="p-6 lg:p-10 flex flex-col justify-center relative overflow-hidden">
            {/* Top label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-[#E10600] text-white px-2 py-1 text-[10px] font-black tracking-[0.2em] font-mono-omni">OMNIFLOW — EST. 2026</span>
              <DiagonalBars count={4} />
              <span className="text-[9px] font-mono-omni tracking-widest text-white/50 hidden sm:inline">CONTENT INTELLIGENCE / OMNICHANNEL AUTOMATION</span>
            </div>

            <h1 className="font-display leading-[0.82] tracking-[-0.03em]">
              <span className="block text-[42px] lg:text-[64px] text-white">CONTENT</span>
              <span className="block text-[42px] lg:text-[64px] text-[#E10600] relative">
                INTELLIGENCE
                <span className="absolute -right-6 -top-2 hidden lg:block">
                  <SplatterSmall className="w-14 h-10 opacity-90" />
                </span>
              </span>
              <span className="block text-[42px] lg:text-[64px] text-white">FOR EVERY</span>
              <span className="block text-[42px] lg:text-[64px] text-transparent" style={{ WebkitTextStroke: '1.5px white' }}>
                CHANNEL.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 border-l-2 border-[#E10600] pl-3">
              Transform ideas into <span className="text-white font-bold">conteúdo de alto impacto</span> para cada canal. IA analiza tu premisa, genera
              conceptos por plataforma y automatiza edición → aprobación → programación.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="bg-white text-black px-4 py-2 font-condensed font-black tracking-widest text-xs border-2 border-white flex items-center gap-2">
                <IconBolt size={14} /> IDEA → CONCEPT → CONTENT → SCHEDULE
              </span>
              <span className="text-[10px] font-mono-omni tracking-[0.18em] text-white/60">SCROLL TO CREATE ↓</span>
            </div>

            {/* Stats like reference "03 IDEAS 15 CONCEPTS" */}
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                { v: String(stats.ideas).padStart(2, '0'), k: 'IDEAS' },
                { v: String(stats.variantes).padStart(2, '0'), k: 'CONCEPTS' },
                { v: String(stats.scheduled).padStart(2, '0'), k: 'SCHEDULED' },
              ].map((s) => (
                <div key={s.k} className="bg-white text-black border-2 border-black p-2.5 text-center relative">
                  <div className="absolute -top-1 -right-1 size-2 bg-[#E10600]" />
                  <p className="font-display text-2xl leading-none">{s.v}</p>
                  <p className="text-[9px] font-mono-omni tracking-[0.18em] text-black/60">{s.k}</p>
                </div>
              ))}
            </div>

            {/* bottom red bar inside hero */}
            <div className="mt-8 -mx-6 lg:-mx-10 -mb-6 lg:-mb-10 bg-[#E10600] text-white px-6 lg:px-10 py-2 flex items-center gap-3 relative overflow-hidden">
              <div className="absolute inset-0 halftone-black opacity-15" />
              <span className="relative text-[10px] font-black tracking-[0.2em] font-mono-omni bg-black px-2 py-1">WORKFLOW</span>
              <span className="relative text-xs font-condensed font-black tracking-widest hidden sm:inline">IDEA → IA ANALIZA → GENERA CONCEPTOS → USUARIO SELECCIONA → GENERA CONTENIDO → EDITA → APRUEBA → PROGRAMA → DISTRIBUYE</span>
              <span className="relative sm:hidden text-xs font-condensed font-black tracking-widest">IDEA → IA → CONCEPT → APPROVE → SHIP</span>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="relative bg-[#F5F5F5] border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-black flex flex-col min-h-[380px]">
            <div className="flex-1 relative">
              <HeroIllustration className="absolute inset-0 h-full w-full" />
              {/* Top platform pills */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-[#111111] text-white px-2 py-1 text-[9px] font-black tracking-[0.18em] font-mono-omni border border-black flex items-center gap-1.5">
                  <span className="size-1.5 bg-[#E10600] rounded-full animate-pulse" /> LIVE GENERATION
                </span>
                <span className="bg-[#E10600] text-white px-2 py-1 text-[9px] font-black tracking-[0.18em] font-mono-omni">● REC</span>
              </div>
              {/* Bottom caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-black text-white px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] font-mono-omni tracking-widest">OMNIFLOW CREATOR // AI-001</span>
                <span className="text-[10px] font-black bg-[#E10600] px-1.5 py-0.5">TIKTOK / IG / FB</span>
              </div>
            </div>
            {/* small info strip like newsletter / dev blog in reference */}
            <div className="grid grid-cols-2 divide-x-2 divide-black border-t-2 border-black bg-white text-black">
              <div className="p-3">
                <p className="text-[9px] font-mono-omni tracking-[0.2em] text-[#E10600]">NEWSLETTER</p>
                <p className="font-condensed font-black text-xs leading-tight mt-1">Why is Fun? #001 Edition</p>
                <span className="mt-2 inline-flex bg-black text-white text-[9px] px-2 py-1 font-bold tracking-widest">SUBSCRIBE →</span>
              </div>
              <div className="p-3 relative overflow-hidden">
                <p className="text-[9px] font-mono-omni tracking-[0.2em] text-[#E10600]">DEV BLOG</p>
                <p className="font-condensed font-black text-xs leading-tight mt-1">How OmniFlow thinks like an editor</p>
                <span className="absolute right-2 bottom-2 size-6 bg-[#E10600] text-white flex items-center justify-center font-black text-xs">↗</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FORM SECTION */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left label vertical like comic */}
        <div className="hidden lg:flex lg:col-span-1 flex-col gap-3 sticky top-[88px]">
          <div className="bg-[#E10600] text-white p-3 border-2 border-black shadow-[4px_4px_0_#111]">
            <p className="font-display text-2xl leading-none">CREATE</p>
            <p className="font-display text-2xl leading-none text-black">NEW</p>
            <p className="font-display text-2xl leading-none">IDEA</p>
            <div className="mt-3 h-1 w-full bg-black" />
            <p className="mt-2 text-[9px] font-mono-omni tracking-widest leading-tight">STEP 01 — WHAT DO YOU WANT TO TALK ABOUT?</p>
          </div>
          <div className="bg-[#111111] text-white p-2 border-2 border-black text-center">
            <p className="text-[9px] font-mono-omni tracking-[0.2em] text-[#E10600]">TONES</p>
            <p className="font-display text-lg">05</p>
          </div>
          <div className="bg-white text-black p-2 border-2 border-black text-center">
            <p className="text-[9px] font-mono-omni tracking-[0.2em]">CHANNELS</p>
            <p className="font-display text-lg">{canales.length || '--'}</p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-11">
          {errorCanales ? (
            <div className="mb-4">
              <ErrorAlert mensaje={errorCanales} onReintentar={cargarCanales} />
            </div>
          ) : null}

          {canalesCargando ? (
            <Loading mensaje="CARGANDO CANALES…" />
          ) : (
            <form onSubmit={enviar} className="space-y-5">
              {/* Premise panel */}
              <div className="bg-white border-[3px] border-black shadow-[6px_6px_0_#111] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#E10600] text-white px-3 py-1 font-mono-omni text-[10px] font-black tracking-[0.18em]">01 — PREMISA / IDEA</div>
                <div className="absolute top-0 left-0 w-full h-1 bg-black" />
                <div className="p-5 lg:p-6 pt-8">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h2 className="font-display text-2xl lg:text-3xl leading-none">
                      WHAT DO YOU <span className="text-[#E10600]">WANT TO TALK</span> ABOUT?
                    </h2>
                    <IconSpark size={22} />
                  </div>
                  <p className="text-xs font-mono-omni tracking-wide text-black/60 mb-3">Escribí una premisa corta. La IA generará conceptos optimizados por canal. Ej: “3 errores que matan el alcance orgánico en 2026”.</p>

                  <div className="relative">
                    <textarea
                      id="premisa"
                      value={premisa}
                      onChange={(e) => setPremisa(e.target.value)}
                      rows={4}
                      placeholder="Ej.: Por qué los creadores deberían usar IA para escalar sus contenidos sin perder autenticidad…"
                      className="w-full input-brutal rounded-none px-4 py-3 text-sm leading-relaxed placeholder:text-black/40 min-h-[120px]"
                    />
                    <div className="absolute bottom-2 right-2 flex items-center gap-2">
                      <span className="text-[10px] font-mono-omni bg-black text-white px-2 py-1">{premisa.length} CHARS</span>
                      <span className={`text-[10px] font-mono-omni px-2 py-1 border-2 border-black font-black ${premisa.trim().length >= 3 ? 'bg-[#E10600] text-white border-[#E10600]' : 'bg-white text-black'}`}>
                        {premisa.trim().length >= 3 ? 'READY' : 'MIN 3'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* tone + channel inside same panel but separated */}
                <div className="grid md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black border-t-2 border-black">
                  {/* Tone */}
                  <div className="p-5 bg-[#F5F5F5] relative">
                    <div className="absolute inset-0 halftone opacity-[0.06] pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-black text-white px-2 py-1 text-[10px] font-black tracking-[0.2em] font-mono-omni">02</span>
                        <h3 className="font-condensed font-black tracking-[0.12em] text-sm">TONE</h3>
                        <span className="h-px flex-1 bg-black/20" />
                        <span className="text-[10px] font-mono-omni text-black/50">SELECT ONE</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {TONOS.map((t) => {
                          const active = tono === t
                          const meta = TONO_LABELS[t]
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTono(t)}
                              className={`text-left p-3 border-2 transition-all relative overflow-hidden group ${
                                active ? 'bg-[#E10600] text-white border-black shadow-[3px_3px_0_#111]' : 'bg-white text-black border-black hover:bg-black hover:text-white'
                              }`}
                            >
                              {active && <div className="absolute inset-0 halftone-white opacity-10 pointer-events-none" />}
                              <p className="relative font-condensed font-black text-xs tracking-widest leading-none">{meta.label}</p>
                              <p className={`relative text-[10px] font-mono-omni tracking-wide ${active ? 'text-white/80' : 'text-black/60 group-hover:text-white/70'}`}>{meta.desc}</p>
                              {active && <span className="absolute top-1 right-1 size-2 bg-white rounded-full" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="p-5 bg-white relative">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#E10600] text-white px-2 py-1 text-[10px] font-black tracking-[0.2em] font-mono-omni">03</span>
                      <h3 className="font-condensed font-black tracking-[0.12em] text-sm">PLATFORMS</h3>
                      <span className="h-px flex-1 bg-black/15" />
                      <span className="text-[10px] font-mono-omni bg-black text-white px-1.5 py-0.5">{canalIds.length} SELECTED</span>
                    </div>

                    <div className="grid gap-2">
                      {canales.map((c) => {
                        const active = canalIds.includes(c.id)
                        const slug = c.slug || c.nombre
                        return (
                          <label
                            key={c.id}
                            className={`flex cursor-pointer items-center gap-3 border-2 px-3 py-2.5 transition-all relative ${
                              active ? 'bg-[#111111] text-white border-[#111111] shadow-[3px_3px_0_#E10600]' : 'bg-white text-black border-black hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <input type="checkbox" checked={active} onChange={() => toggleCanal(c.id)} className="sr-only" />
                            <span className={`size-9 flex items-center justify-center border-2 shrink-0 ${active ? 'bg-[#E10600] border-[#E10600] text-white' : 'bg-black text-white border-black'}`}>
                              {ChannelMeta(slug)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-condensed font-black text-xs tracking-[0.1em] leading-none">{c.nombre.toUpperCase()}</p>
                              <p className={`text-[10px] font-mono-omni truncate ${active ? 'text-white/60' : 'text-black/50'}`}>{slug} • {c.plataforma}</p>
                            </div>
                            <span className={`ml-auto size-5 border-2 flex items-center justify-center text-[10px] font-black shrink-0 ${active ? 'bg-[#E10600] border-[#E10600] text-white' : 'border-black text-transparent'}`}>✓</span>
                          </label>
                        )
                      })}
                      {canales.length === 0 && !canalesCargando && <p className="text-xs font-mono-omni text-black/60">No hay canales disponibles todavía.</p>}
                    </div>
                  </div>
                </div>
              </div>

              {error && <ErrorAlert mensaje={error} />}

              {/* Generate button - brutal */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <button
                  type="submit"
                  disabled={enviando || canalesCargando}
                  className="flex-1 bg-[#E10600] text-white border-[3px] border-black shadow-[6px_6px_0_#111] px-6 py-4 font-display text-xl lg:text-2xl tracking-wide flex items-center justify-center gap-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#111] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#111] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="size-8 bg-black text-white flex items-center justify-center text-sm group-hover:bg-white group-hover:text-black transition-colors">▶</span>
                  {enviando ? 'GENERATING CONTENT IDEAS…' : 'GENERATE CONTENT IDEAS'}
                  <span className="hidden sm:inline-flex bg-white text-black text-[10px] font-mono-omni px-2 py-1 tracking-widest">AI POWERED</span>
                </button>
                <div className="bg-[#111111] text-white border-2 border-black px-4 py-3 flex items-center gap-3 lg:w-[280px]">
                  <div className="size-10 bg-[#E10600] border-2 border-white flex items-center justify-center font-display text-lg">!</div>
                  <p className="text-[10px] font-mono-omni leading-tight tracking-wide text-white/80">
                    La IA creará <span className="text-white font-black">variantes por canal</span> listas para editar y aprobar.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono-omni tracking-[0.14em] text-black/50">
                <span className="h-px flex-1 bg-black/15" />
                <span>{canales.length} CANALES DISPONIBLES • {TONOS.length} TONOS • OMNIFLOW v2.6</span>
                <span className="h-px flex-1 bg-black/15" />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
