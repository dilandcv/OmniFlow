// Hero poster illustration in black/white/red comic style
// Mix: silhouette of creator with phone/camera, AI chip, halftone, splatters

export function HeroIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden select-none ${className}`} aria-hidden>
      {/* Background city/ halftone */}
      <svg viewBox="0 0 640 440" className="w-full h-full" role="img">
        <defs>
          <pattern id="halftoneHero" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1.3" fill="black" opacity="0.25" />
          </pattern>
          <pattern id="diagHero" width="12" height="12" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="6" height="12" fill="black" opacity="0.07" />
          </pattern>
        </defs>

        {/* Paper bg */}
        <rect width="640" height="440" fill="#F5F5F5" />
        <rect width="640" height="440" fill="url(#diagHero)" />

        {/* City silhouette top */}
        <path
          d="M0 145 L20 145 L20 100 L38 100 L38 125 L52 125 L52 85 L72 85 L72 130 L90 130 L90 70 L112 70 L112 135 L135 135 L135 95 L158 95 L158 128 L175 128 L175 60 L195 60 L195 140 L220 140 L220 90 L242 90 L242 135 L260 135 L260 75 L285 75 L285 130 L305 130 L305 88 L328 88 L328 138 L350 138 L350 105 L372 105 L372 132 L390 132 L390 78 L415 78 L415 135 L435 135 L435 92 L458 92 L458 130 L478 130 L478 68 L502 68 L502 132 L522 132 L522 102 L545 102 L545 140 L565 140 L565 85 L590 85 L590 128 L612 128 L612 110 L640 110 L640 145 Z"
          fill="#111111"
          opacity={0.95}
        />
        {/* red windows */}
        <g fill="#E10600" opacity={0.9}>
          <rect x="57" y="95" width="6" height="6" />
          <rect x="57" y="105" width="6" height="6" />
          <rect x="96" y="88" width="7" height="5" />
          <rect x="96" y="98" width="7" height="5" />
          <rect x="180" y="75" width="6" height="7" />
          <rect x="180" y="88" width="6" height="7" />
          <rect x="268" y="88" width="6" height="6" />
          <rect x="395" y="95" width="6" height="6" />
          <rect x="485" y="82" width="7" height="6" />
        </g>

        {/* Giant red splatter behind figure */}
        <path
          d="M210 210 Q 230 150 285 170 Q 320 135 360 170 Q 400 145 430 195 Q 460 210 440 250 Q 455 290 420 310 Q 385 340 340 315 Q 300 335 265 305 Q 220 325 200 275 Q 175 245 210 210 Z"
          fill="#E10600"
        />
        <circle cx="180" cy="195" r="6" fill="#E10600" />
        <circle cx="165" cy="175" r="3.5" fill="#E10600" />
        <circle cx="470" cy="200" r="4.5" fill="#E10600" />
        <circle cx="485" cy="180" r="2.8" fill="#E10600" />
        <circle cx="195" cy="320" r="3" fill="#E10600" />

        {/* Halftone overlay on red splatter */}
        <path
          d="M210 210 Q 230 150 285 170 Q 320 135 360 170 Q 400 145 430 195 Q 460 210 440 250 Q 455 290 420 310 Q 385 340 340 315 Q 300 335 265 305 Q 220 325 200 275 Q 175 245 210 210 Z"
          fill="url(#halftoneHero)"
          opacity={0.35}
        />

        {/* Silhouette: Creator with phone/camera - stylized */}
        {/* Body */}
        <g fill="#050505" stroke="#050505" strokeLinejoin="round">
          {/* Legs */}
          <path d="M285 380 L 272 285 L 298 285 L 310 335 L 330 335 L 345 285 L 368 285 L 360 380 Z" />
          {/* Boots red sole */}
          <rect x="272" y="376" width="26" height="8" fill="#E10600" />
          <rect x="342" y="376" width="18" height="8" fill="#E10600" />
          {/* Torso */}
          <path d="M275 285 Q 320 260 365 285 L 368 285 L 355 220 L 285 220 Z" />
          {/* Belt */}
          <rect x="285" y="255" width="70" height="10" fill="white" stroke="black" strokeWidth={2} />
          <rect x="312" y="252" width="18" height="16" fill="#E10600" stroke="black" strokeWidth={1.5} />
          {/* Arms */}
          <path d="M285 225 Q 250 240 240 270 Q 235 285 250 292 Q 268 285 285 250" />
          <path d="M355 225 Q 390 240 400 255 Q 405 268 390 272 Q 370 262 355 240" />
          {/* Head - helmet / masked creator */}
          <ellipse cx="322" cy="185" rx="32" ry="34" fill="#050505" />
          {/* Visor red */}
          <path d="M300 188 Q 322 202 344 188 L 342 175 Q 322 185 302 175 Z" fill="#E10600" stroke="white" strokeWidth={1.2} />
          {/* Antenna */}
          <rect x="320" y="145" width="4" height="22" fill="#050505" />
          <circle cx="322" cy="142" r="5" fill="#E10600" stroke="black" strokeWidth={1.5} />
          <circle cx="298" cy="150" r="2" fill="white" opacity={0.9} />
          {/* Phone in hand */}
          <rect x="234" y="230" width="28" height="48" rx="4" fill="white" stroke="black" strokeWidth={2.5} />
          <rect x="238" y="238" width="20" height="28" fill="#111111" />
          <circle cx="248" cy="272" r="2" fill="#E10600" />
          {/* Camera around neck */}
          <rect x="306" y="225" width="22" height="16" rx="2" fill="#252525" stroke="white" strokeWidth={1} />
          <circle cx="317" cy="233" r="5" fill="#111111" stroke="#E10600" strokeWidth={1.2} />
        </g>

        {/* Giant phone/device behind second layer - outline */}
        <g opacity={0.14} stroke="#111111" strokeWidth={3} fill="none">
          <rect x="410" y="175" width="78" height="135" rx="12" />
          <rect x="418" y="190" width="62" height="95" rx="3" />
          <circle cx="449" cy="300" r="5" />
        </g>

        {/* Floating content cards - comic panels */}
        <g>
          <g transform="rotate(-4 520 220)">
            <rect x="500" y="185" width="84" height="68" fill="white" stroke="#111111" strokeWidth={3} />
            <rect x="500" y="185" width="84" height="14" fill="#111111" />
            <text x="510" y="195" fill="white" fontSize="6" fontWeight="900" fontFamily="Barlow Condensed">TIKTOK</text>
            <line x1="510" y1="205" x2="574" y2="205" stroke="black" strokeWidth={1} opacity={0.2} />
            <line x1="510" y1="212" x2="568" y2="212" stroke="black" strokeWidth={1} opacity={0.2} />
            <line x1="510" y1="219" x2="572" y2="219" stroke="black" strokeWidth={1} opacity={0.2} />
            <circle cx="518" cy="238" r="8" fill="#E10600" />
            <rect x="532" y="232" width="34" height="4" fill="#111111" opacity={0.9} />
            <rect x="532" y="239" width="24" height="3" fill="#777777" />
          </g>
          <g transform="rotate(3 515 300)">
            <rect x="485" y="270" width="92" height="60" fill="white" stroke="#111111" strokeWidth={3} />
            <rect x="485" y="270" width="92" height="14" fill="#E10600" />
            <text x="495" y="280" fill="white" fontSize="6" fontWeight="900">INSTAGRAM</text>
            <rect x="495" y="292" width="72" height="28" fill="#111111" opacity={0.08} />
            <circle cx="505" cy="310" r="2" fill="#E10600" />
          </g>
        </g>

        {/* Halftone texture at bottom */}
        <rect x="0" y="380" width="640" height="60" fill="url(#halftoneHero)" opacity={0.18} />

        {/* Ink drips bottom */}
        <path d="M0 385 Q 18 402 35 385 Q 50 405 68 385 Q 85 400 102 383 Q 125 398 142 384 Q 165 402 185 383 Q 205 396 225 384 Q 245 400 265 383 Q 285 398 305 384 Q 325 398 345 383 Q 365 402 385 383 Q 405 395 425 384 Q 445 398 465 383 Q 485 400 505 384 Q 525 396 545 383 Q 565 402 585 384 Q 603 396 622 384 Q 640 395 640 385 L 640 440 L 0 440 Z" fill="#050505" />
        {/* small white highlight on ink */}
        <path d="M25 390 Q 30 388 35 390" stroke="white" strokeWidth={1} opacity={0.4} fill="none" />
      </svg>

      {/* Top grain */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }} />
    </div>
  )
}

export function ChannelPoster({ platform, className = "" }: { platform: "tiktok" | "instagram" | "facebook"; className?: string }) {
  const colors: Record<string, string> = {
    tiktok: "#E10600",
    instagram: "#111111",
    facebook: "#050505",
  }
  const label = platform.toUpperCase()
  return (
    <div className={`relative bg-white border-[3px] border-black p-3 ${className}`}>
      <div className="absolute -top-2 -right-2 bg-[#E10600] text-white text-[8px] font-black px-1.5 py-0.5 tracking-widest font-mono-omni rotate-2">
        {label}
      </div>
      <div className="w-full aspect-[4/3] bg-[#111111] flex items-center justify-center relative overflow-hidden">
        <div className="halftone-white absolute inset-0 opacity-20" />
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="34" fill="none" stroke="white" strokeWidth={2.5} />
          <circle cx="50" cy="50" r="18" fill={colors[platform]} />
          <text x="50" y="56" textAnchor="middle" fill="white" fontSize="12" fontWeight="900" fontFamily="Anton">
            {label[0]}
          </text>
        </svg>
        {/* splatter */}
        <div className="absolute bottom-0 left-0 w-full h-6 bg-[#E10600] opacity-90" style={{ clipPath: "polygon(0 60%, 12% 0, 25% 55%, 38% 15%, 52% 60%, 68% 10%, 82% 50%, 92% 5%, 100% 40%, 100% 100%, 0 100%)" }} />
      </div>
      <div className="mt-2 h-1.5 w-full bg-black" />
      <div className="mt-1.5 space-y-1">
        <div className="h-2 w-3/4 bg-black opacity-90" />
        <div className="h-1.5 w-full bg-black opacity-15" />
        <div className="h-1.5 w-5/6 bg-black opacity-15" />
      </div>
    </div>
  )
}

export function AiChipIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <rect width="200" height="200" fill="#F5F5F5" />
      <rect x="55" y="55" width="90" height="90" fill="#111111" stroke="#111111" strokeWidth={4} />
      <rect x="65" y="65" width="70" height="70" fill="white" />
      <rect x="75" y="75" width="50" height="50" fill="#E10600" />
      <circle cx="100" cy="100" r="14" fill="white" stroke="black" strokeWidth={2} />
      <circle cx="100" cy="100" r="5" fill="#111111" />
      {/* pins */}
      <g stroke="#111111" strokeWidth={4} strokeLinecap="square">
        <line x1="70" y1="40" x2="70" y2="55" /><line x1="85" y1="40" x2="85" y2="55" /><line x1="100" y1="40" x2="100" y2="55" /><line x1="115" y1="40" x2="115" y2="55" /><line x1="130" y1="40" x2="130" y2="55" />
        <line x1="70" y1="145" x2="70" y2="160" /><line x1="85" y1="145" x2="85" y2="160" /><line x1="100" y1="145" x2="100" y2="160" /><line x1="115" y1="145" x2="115" y2="160" /><line x1="130" y1="145" x2="130" y2="160" />
        <line x1="40" y1="70" x2="55" y2="70" /><line x1="40" y1="85" x2="55" y2="85" /><line x1="40" y1="100" x2="55" y2="100" /><line x1="40" y1="115" x2="55" y2="115" /><line x1="40" y1="130" x2="55" y2="130" />
        <line x1="145" y1="70" x2="160" y2="70" /><line x1="145" y1="85" x2="160" y2="85" /><line x1="145" y1="100" x2="160" y2="100" /><line x1="145" y1="115" x2="160" y2="115" /><line x1="145" y1="130" x2="160" y2="130" />
      </g>
      <circle cx="28" cy="28" r="3" fill="#E10600" />
      <circle cx="172" cy="38" r="2" fill="#E10600" />
    </svg>
  )
}
