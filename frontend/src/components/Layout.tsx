import type { ReactNode } from 'react'
import { useApp } from '../state/AppContext'
import { SplatterRed } from './graphics/Splatter'

interface NavItem {
  clave: 'idea' | 'variantes' | 'programacion' | 'ai'
  etiqueta: string
  desc: string
  num: string
}

const NAV: NavItem[] = [
  { clave: 'idea', etiqueta: 'IDEAS', desc: 'CREATE', num: '01' },
  { clave: 'variantes', etiqueta: 'CONCEPTS', desc: 'CONTENT', num: '02' },
  { clave: 'programacion', etiqueta: 'SCHEDULE', desc: 'PUBLISH', num: '03' },
  { clave: 'ai', etiqueta: 'AI', desc: 'CONFIG', num: '04' },
]

export function Layout({ children }: { children: ReactNode }) {
  const { vista, navegar, ideaActualId, ideas } = useApp()
  const pendingCount = ideas.flatMap((i) => i.variantes).filter((v) => v.estado === 'borrador').length

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111111] flex flex-col">
      {/* Top ink texture bar */}
      <div className="h-1.5 w-full bg-[#E10600] relative overflow-hidden">
        <div className="absolute inset-0 halftone-black opacity-20" />
      </div>

      {/* Header - black brutal */}
      <header className="sticky top-0 z-30 bg-[#050505] border-b-[4px] border-[#E10600] relative">
        {/* halftone on header */}
        <div className="absolute inset-0 halftone-white opacity-[0.04] pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0 2px, rgba(255,255,255,0.04) 2px 3px)` }} />

        <div className="relative mx-auto max-w-[1280px] px-4 lg:px-6 flex items-center justify-between gap-4 py-3 lg:py-3.5">
          {/* Logo - like AZTEZ header */}
          <button
            type="button"
            onClick={() => navegar('idea')}
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="relative">
              <div className="bg-[#E10600] px-3 py-1.5 flex items-center gap-2 border-2 border-[#E10600] group-hover:bg-white transition-colors duration-150">
                <span className="size-7 bg-[#050505] text-white flex items-center justify-center font-display text-[14px] leading-none border border-white">O</span>
                <span className="font-display text-[22px] leading-none tracking-[0.02em] text-white group-hover:text-black">OMNIFLOW</span>
                <span className="hidden sm:inline-flex bg-black text-white text-[8px] font-mono-omni px-1 py-0.5 tracking-widest ml-1">2026</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-full h-full border border-white/20 pointer-events-none hidden lg:block" />
            </div>
            <span className="hidden xl:block text-[9px] font-mono-omni tracking-[0.2em] text-white/60 leading-tight text-left">
              CONTENT<br />INTELLIGENCE<br />CENTER
            </span>
          </button>

          {/* Nav - desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-white p-1 border-2 border-white">
            {NAV.map((item) => {
              const activo = vista === item.clave
              const showDot = item.clave === 'variantes' && pendingCount > 0 && !activo
              return (
                <button
                  key={item.clave}
                  type="button"
                  onClick={() => navegar(item.clave, item.clave === 'variantes' ? ideaActualId : null)}
                  className={`relative flex items-center gap-2 px-4 py-1.5 font-condensed font-black text-[13px] tracking-[0.08em] transition-all border-2 ${
                    activo
                      ? 'bg-[#E10600] text-white border-[#E10600] shadow-[2px_2px_0_#111]'
                      : 'bg-white text-black border-transparent hover:border-black hover:bg-black hover:text-white'
                  }`}
                >
                  <span className={`text-[9px] font-mono-omni opacity-60 ${activo ? 'text-white' : 'text-[#E10600]'}`}>{item.num}</span>
                  {item.etiqueta}
                  {showDot && <span className="size-2 bg-[#E10600] rounded-full animate-pulse" />}
                  {activo && <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#E10600] rotate-45 border-r border-b border-black/20" />}
                </button>
              )
            })}
            {/* AI status - clickable */}
            <button
              type="button"
              onClick={() => navegar('ai')}
              className={`ml-2 flex items-center gap-1.5 px-2.5 py-1 border-2 transition-colors ${vista === 'ai' ? 'bg-[#E10600] text-white border-[#E10600]' : 'bg-[#111111] text-white border-black hover:bg-white hover:text-black'}`}
            >
              <span className="size-1.5 bg-[#E10600] animate-pulse rounded-full" />
              <span className="text-[10px] font-black tracking-[0.12em] font-condensed">AI • GEMINI</span>
              <span className="size-1.5 bg-white rounded-full opacity-60" />
            </button>
          </nav>

          {/* Nav mobile - condensed */}
          <nav className="flex md:hidden items-center gap-1">
            {NAV.map((item) => {
              const activo = vista === item.clave
              return (
                <button
                  key={item.clave}
                  type="button"
                  onClick={() => navegar(item.clave, item.clave === 'variantes' ? ideaActualId : null)}
                  className={`px-2.5 py-1.5 font-condensed font-black text-[11px] tracking-widest border-2 ${
                    activo ? 'bg-[#E10600] text-white border-[#E10600]' : 'bg-white text-black border-black'
                  }`}
                >
                  {item.num}
                </button>
              )
            })}
          </nav>

          {/* Social / right block like reference top small icons */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-mono-omni text-white/70">
            <span className="hidden xl:inline tracking-widest">FOLLOW —</span>
            <span className="size-6 border border-white/20 flex items-center justify-center text-[11px] hover:bg-white hover:text-black transition-colors cursor-pointer">◈</span>
            <span className="size-6 border border-white/20 flex items-center justify-center text-[11px] hover:bg-[#E10600] hover:border-[#E10600] transition-colors cursor-pointer">◎</span>
            <span className="size-6 border border-white/20 flex items-center justify-center text-[11px] hover:bg-white hover:text-black transition-colors cursor-pointer">▣</span>
          </div>
        </div>

        {/* Tiny red splatter divider under header - like reference */}
        <div className="absolute -bottom-3 left-0 w-full h-3 pointer-events-none hidden md:block opacity-90">
          <SplatterRed className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.3))' }} />
        </div>
      </header>

      {/* Secondary red bar - like AZTEZ title bar */}
      <div className="bg-[#E10600] relative overflow-hidden py-1.5 border-y-2 border-black">
        <div className="absolute inset-0 halftone-black opacity-15" />
        <div className="relative mx-auto max-w-[1280px] px-4 lg:px-6 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="bg-black text-white px-2 py-0.5 text-[9px] font-black tracking-[0.2em] font-mono-omni shrink-0">LIVE</span>
            <p className="text-[10px] md:text-xs font-bold tracking-[0.14em] uppercase whitespace-nowrap animate-pulse">
              CENTRAL DE INTELIGENCIA DE CONTENIDO • OMNICANAL • IA GENERATIVA • TIKTOK • INSTAGRAM • FACEBOOK • X • LINKEDIN •
            </p>
          </div>
          <span className="hidden md:inline-flex items-center gap-2 text-[9px] font-mono-omni tracking-widest shrink-0">
            <span className="size-2 bg-white rounded-full animate-pulse" /> SYSTEM OPERATIONAL
          </span>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[1280px] px-4 lg:px-6 py-6 lg:py-8 relative">
        {/* Background texture subtle */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `radial-gradient(circle, black 1px, transparent 1px)`, backgroundSize: '18px 18px' }} />
        <div className="relative">{children}</div>
      </main>

      <footer className="mt-8 bg-[#050505] text-white relative overflow-hidden border-t-[4px] border-[#E10600]">
        {/* top texture */}
        <div className="absolute inset-0 halftone-white opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-14 bg-[#E10600] opacity-95" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 55%, 92% 100%, 85% 60%, 78% 95%, 70% 45%, 60% 85%, 48% 35%, 36% 90%, 24% 40%, 12% 80%, 0 50%)' }} />

        <div className="relative mx-auto max-w-[1280px] px-4 lg:px-6 pt-16 pb-8">
          {/* Big footer grid like reference TC TEAM COLORBLIND */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-b border-white/10 pb-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <div className="bg-white text-black px-2 py-1 font-display text-xl leading-none">OMNIFLOW</div>
                <span className="text-[#E10600] font-mono-omni text-xs tracking-widest">© 2026</span>
              </div>
              <p className="mt-3 font-condensed font-black text-2xl leading-none tracking-wide">
                CONTENT<br />
                INTELLIGENCE<br />
                <span className="text-[#E10600]">FOR EVERY CHANNEL.</span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-white/60 max-w-md">
                Transform ideas into high-impact content. IA analiza, genera conceptos, optimiza para cada red y programa distribución omnicanal.
              </p>
              {/* Friends & neighbours style platforms */}
              <div className="mt-5">
                <p className="text-[9px] font-mono-omni tracking-[0.2em] text-white/40 mb-2">FRIENDS & NEIGHBOURS — CHANNELS</p>
                <div className="flex flex-wrap gap-2">
                  {['TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'X', 'LINKEDIN', 'BLOG', 'NEWSLETTER'].map((c) => (
                    <span key={c} className="border border-white/20 px-2 py-1 text-[9px] font-black tracking-widest bg-white/5 hover:bg-[#E10600] hover:border-[#E10600] transition-colors cursor-default">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <p className="text-[10px] font-mono-omni tracking-[0.2em] text-[#E10600]">COMPANY</p>
              <ul className="space-y-1.5 text-xs text-white/70 font-medium">
                <li className="hover:text-white cursor-pointer">• Content Intelligence Center</li>
                <li className="hover:text-white cursor-pointer">• AI Generation Engine (Gemini)</li>
                <li className="hover:text-white cursor-pointer">• Omnichannel Distribution</li>
                <li className="hover:text-white cursor-pointer">• Creator Toolkit</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <span className="border border-white/15 px-2 py-1 text-[9px] tracking-widest bg-white text-black font-black">TC</span>
                <span className="border border-[#E10600] bg-[#E10600] px-2 py-1 text-[9px] tracking-widest font-black">AI</span>
                <span className="border border-white/15 px-2 py-1 text-[9px] tracking-widest">OMNI</span>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white text-black p-4 border-2 border-white relative">
                <div className="absolute -top-2 -right-2 bg-[#E10600] text-white text-[8px] font-black px-2 py-1 rotate-1">COMING 2026</div>
                <p className="font-display text-3xl leading-none">BUILD • CREATE<br />DISTRIBUTE</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="border-2 border-black py-2">
                    <p className="font-display text-xl leading-none">03</p>
                    <p className="text-[8px] font-mono-omni tracking-widest">IDEAS</p>
                  </div>
                  <div className="border-2 border-black py-2 bg-black text-white">
                    <p className="font-display text-xl leading-none text-[#E10600]">15</p>
                    <p className="text-[8px] font-mono-omni tracking-widest">CONCEPTS</p>
                  </div>
                  <div className="border-2 border-black py-2">
                    <p className="font-display text-xl leading-none">08</p>
                    <p className="text-[8px] font-mono-omni tracking-widest">LIVE</p>
                  </div>
                </div>
                <p className="mt-3 text-[9px] font-mono-omni text-black/60 leading-tight">NO STOCK IMAGERY • NO CORPORATE FLUFF • ONLY INK, HALFTONE AND CONTENT THAT HITS.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] font-mono-omni tracking-widest text-white/35">
            <span>BUILT FOR CREATORS • DESIGNED LIKE A POSTER • PRINTED LIKE A COMIC</span>
            <span className="flex items-center gap-2">
              <span className="size-2 bg-[#E10600] rounded-full" /> OMNIFLOW SYSTEM v2.6
            </span>
          </div>
        </div>

        {/* bottom ink drip */}
        <div className="h-3 w-full bg-white opacity-10" style={{ clipPath: 'polygon(0 0, 8% 100%, 14% 0, 22% 85%, 30% 10%, 38% 95%, 46% 20%, 54% 80%, 62% 15%, 70% 90%, 78% 25%, 86% 85%, 94% 5%, 100% 60%, 100% 0)' }} />
      </footer>
    </div>
  )
}
