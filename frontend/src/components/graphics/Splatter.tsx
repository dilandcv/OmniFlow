export function SplatterRed({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="none"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M10 70 Q 20 10 60 35 Q 90 5 120 40 Q 150 15 180 45 Q 210 8 250 35 Q 285 12 310 50 Q 340 18 360 60 Q 380 75 390 55 L 390 95 Q 360 110 320 90 Q 285 115 250 85 Q 210 105 180 75 Q 140 100 110 80 Q 70 105 40 85 Q 15 95 10 70 Z"
        fill="#E10600"
      />
      {/* small droplets */}
      <circle cx="28" cy="22" r="5" fill="#E10600" opacity={0.9} />
      <circle cx="48" cy="12" r="3" fill="#E10600" opacity={0.8} />
      <circle cx="75" cy="18" r="2.5" fill="#E10600" />
      <circle cx="135" cy="10" r="4" fill="#E10600" />
      <circle cx="168" cy="18" r="2" fill="#E10600" />
      <circle cx="275" cy="8" r="3.5" fill="#E10600" />
      <circle cx="335" cy="14" r="2.8" fill="#E10600" />
      <circle cx="355" cy="28" r="1.8" fill="#E10600" />
      <circle cx="18" cy="58" r="1.5" fill="#E10600" />
    </svg>
  )
}

export function SplatterSmall({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <path
        d="M8 40 Q 10 12 30 18 Q 42 6 52 22 Q 64 10 75 24 Q 88 8 100 30 Q 110 38 108 48 Q 100 65 82 58 Q 68 70 58 52 Q 42 64 30 48 Q 14 58 8 40 Z"
        fill="#E10600"
      />
      <circle cx="18" cy="15" r="2" fill="#E10600" />
      <circle cx="95" cy="12" r="1.8" fill="#E10600" />
      <circle cx="105" cy="55" r="1.5" fill="#E10600" />
    </svg>
  )
}

export function InkSplatter({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden>
      <path
        d="M10 30 Q 25 5 50 20 Q 70 2 85 18 Q 100 8 115 22 Q 135 6 155 28 Q 170 15 185 32 L 185 45 Q 160 52 135 42 Q 110 52 90 38 Q 65 48 45 36 Q 22 45 10 30 Z"
        fill="#111111"
        opacity={0.9}
      />
    </svg>
  )
}

export function DiagonalBars({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-2 w-8 -skew-x-12"
          style={{
            background: i % 2 === 0 ? "#E10600" : "#111111",
            opacity: 1 - i * 0.08,
          }}
        />
      ))}
    </div>
  )
}

export function HalftoneDots({ className = "" }: { className?: string }) {
  return <div className={`halftone-red absolute inset-0 pointer-events-none opacity-30 ${className}`} aria-hidden />
}

export function RedBarLabel({ children, variant = "red" }: { children: React.ReactNode; variant?: "red" | "black" | "white" }) {
  const bg = variant === "red" ? "bg-[#E10600] text-white" : variant === "black" ? "bg-[#111111] text-white" : "bg-white text-black border-2 border-black"
  return (
    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-black tracking-[0.18em] uppercase font-mono-omni ${bg}`}>
      {children}
    </span>
  )
}
