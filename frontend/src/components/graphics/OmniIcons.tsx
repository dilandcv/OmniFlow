export function IconTikTok({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.8.11V8.94a6.27 6.27 0 0 0-.8-.05A6.33 6.33 0 0 0 3 14.92a6.33 6.33 0 0 0 6.33 6.33 6.33 6.33 0 0 0 6.33-6.33V8.75a8.08 8.08 0 0 0 4.77 2.71V6.69h-.84z" />
    </svg>
  )
}
export function IconInstagram({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="white" stroke="none" />
    </svg>
  )
}
export function IconFacebook({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M14 8h3V4h-3c-2.76 0-5 2.24-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.55.45-1 1-1z" />
    </svg>
  )
}
export function IconX({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M18 3h3l-6.5 7.44L22 21h-6l-4.7-6.15L5.9 21H2.8l7-8-7-10h6.2l4.25 5.56L18 3z" />
    </svg>
  )
}
export function IconLinkedIn({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M6.5 8.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 10h3v9H5zM10 10h2.9v1.23h.04C13.5 10.1 15.03 9 17.1 9 20.2 9 21 11 21 14.3V19h-3v-4.1c0-1-.02-2.3-1.4-2.3-1.4 0-1.6 1.1-1.6 2.2V19h-3v-9z" />
    </svg>
  )
}

// Brutalist generic icons as SVG
export function IconBolt({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E10600" className={className} aria-hidden>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="black" strokeWidth={1.2} />
    </svg>
  )
}
export function IconSpark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#E10600" strokeWidth={1.8} aria-hidden>
      <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5L12 2z" fill="#E10600" />
      <circle cx="19" cy="5" r="1.5" fill="#E10600" />
      <circle cx="5" cy="14" r="1" fill="#111111" />
    </svg>
  )
}
export function IconCalendar({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <rect x="3" y="5" width="18" height="15" rx="1" strokeWidth={1.8} />
      <path d="M3 9h18M8 3v4M16 3v4" />
      <rect x="7" y="12" width="3" height="3" fill="#E10600" stroke="none" />
    </svg>
  )
}
