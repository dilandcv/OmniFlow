// Badge visual de estado, coloreado según el flujo del dominio.
import type { EstadoProgramacion, EstadoVariante } from '../api/types'

const VARIANTE_ESTILOS: Record<EstadoVariante, string> = {
  borrador: 'bg-slate-100 text-slate-600 border-slate-300',
  aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  programado: 'bg-indigo-50 text-indigo-700 border-indigo-300',
  publicado: 'bg-sky-50 text-sky-700 border-sky-300',
}

const PROGRAMACION_ESTILOS: Record<EstadoProgramacion, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border-amber-300',
  publicado: 'bg-sky-50 text-sky-700 border-sky-300',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-300',
}

const VALOR = {
  borrador: 'Borrador',
  aprobado: 'Aprobado',
  programado: 'Programado',
  publicado: 'Publicado',
  pendiente: 'Pendiente',
  cancelado: 'Cancelado',
} as const

export function EstadoBadge({ estado }: { estado: EstadoVariante | EstadoProgramacion }) {
  const estilos =
    estado in VARIANTE_ESTILOS
      ? VARIANTE_ESTILOS[estado as EstadoVariante]
      : PROGRAMACION_ESTILOS[estado as EstadoProgramacion]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${estilos}`}
    >
      {VALOR[estado as keyof typeof VALOR] ?? estado}
    </span>
  )
}