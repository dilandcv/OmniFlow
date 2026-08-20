import type { EstadoProgramacion, EstadoVariante } from '../api/types'

const VARIANTE_STYLES: Record<EstadoVariante, string> = {
  borrador: 'bg-[#111111] text-white border-black',
  aprobado: 'bg-[#E10600] text-white border-black',
  programado: 'bg-white text-black border-black',
  publicado: 'bg-[#111111] text-[#E10600] border-[#E10600]',
}

const PROGRAMACION_STYLES: Record<EstadoProgramacion, string> = {
  pendiente: 'bg-[#E10600] text-white border-black',
  publicado: 'bg-black text-white border-black',
  cancelado: 'bg-white text-black border-black line-through',
}

const LABEL: Record<string, string> = {
  borrador: 'DRAFT',
  aprobado: 'APPROVED',
  programado: 'SCHEDULED',
  publicado: 'PUBLISHED',
  pendiente: 'PENDING',
  cancelado: 'CANCELLED',
}

export function EstadoBadge({ estado }: { estado: EstadoVariante | EstadoProgramacion }) {
  const styles =
    estado in VARIANTE_STYLES
      ? VARIANTE_STYLES[estado as EstadoVariante]
      : PROGRAMACION_STYLES[estado as EstadoProgramacion]
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 px-2 py-0.5 text-[10px] font-black tracking-[0.14em] font-mono-omni uppercase ${styles}`}
    >
      <span className="size-1.5 bg-current rounded-full opacity-80" />
      {LABEL[estado as string] ?? estado.toUpperCase()}
    </span>
  )
}
