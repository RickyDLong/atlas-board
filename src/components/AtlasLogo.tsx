interface AtlasLogoProps {
  size?: number;
  className?: string;
}

export function AtlasLogo({ size = 32, className = '' }: AtlasLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dark background with subtle border */}
      <rect width="48" height="48" rx="10" fill="#16161e" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="9.5" stroke="#2a2a3a" strokeOpacity="0.6" />

      {/* Geometric "A" — two upward strokes meeting at apex with crossbar */}
      {/* Left stroke */}
      <path
        d="M14 36L22.5 10.5H25.5L34 36"
        stroke="url(#atlas-gradient)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Crossbar */}
      <line
        x1="17.5"
        y1="27"
        x2="30.5"
        y2="27"
        stroke="url(#atlas-gradient)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Accent dot at apex */}
      <circle cx="24" cy="9" r="2.5" fill="#4a9eff" />

      <defs>
        <linearGradient id="atlas-gradient" x1="24" y1="8" x2="24" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4a9eff" />
          <stop offset="1" stopColor="#7c5cfc" />
        </linearGradient>
      </defs>
    </svg>
  );
}
