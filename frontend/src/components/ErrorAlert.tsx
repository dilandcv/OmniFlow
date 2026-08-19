export function ErrorAlert({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <span aria-hidden>⚠️</span>
        <span>{mensaje}</span>
      </div>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="shrink-0 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}