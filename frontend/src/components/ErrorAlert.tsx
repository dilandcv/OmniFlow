export function ErrorAlert({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-[3px] border-black bg-[#E10600] text-white p-3 shadow-[4px_4px_0_#111] relative overflow-hidden">
      <div className="absolute inset-0 halftone-white opacity-10 pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <span className="size-7 bg-black text-white flex items-center justify-center font-black text-sm shrink-0 border-2 border-white">!</span>
        <span className="text-xs font-bold leading-tight tracking-wide">{mensaje}</span>
      </div>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="relative shrink-0 bg-white text-black border-2 border-black px-3 py-1.5 text-xs font-black tracking-widest hover:bg-black hover:text-white transition-colors"
        >
          REINTENTAR
        </button>
      )}
    </div>
  )
}
