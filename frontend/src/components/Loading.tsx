export function Loading({ mensaje = 'CARGANDO…' }: { mensaje?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 border-[3px] border-black bg-white shadow-[6px_6px_0_#111] relative overflow-hidden">
      <div className="absolute inset-0 halftone opacity-[0.04] pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-[#E10600]" />
      <span aria-hidden className="size-10 border-[3px] border-black border-t-[#E10600] animate-spin" style={{ borderRadius: 0 }} />
      <span className="font-condensed font-black tracking-[0.18em] text-xs text-black">{mensaje.toUpperCase()}</span>
      <span className="text-[10px] font-mono-omni text-black/50 tracking-widest">OMNIFLOW AI • GENERATING</span>
    </div>
  )
}
