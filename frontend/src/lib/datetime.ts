// Utilidades de fechas (el backend manda ISO 8601; el input datetime-local
// trabaja en hora local).

export function formatFecha(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

export function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function minutoLocal(d: Date): string {
  const conSegundos = new Date(d)
  conSegundos.setSeconds(0, 0)
  return toDateTimeLocal(conSegundos)
}

export function fromDateTimeLocal(value: string): string {
  return new Date(value).toISOString()
}