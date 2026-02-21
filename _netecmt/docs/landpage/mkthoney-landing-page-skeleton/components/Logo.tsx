import React from 'react'

type LogoProps = {
  className?: string
  showText?: boolean
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true }) => {
  // Unique IDs to avoid conflicts when multiple logos render on same page
  const id = React.useId().replace(/:/g, '')

  return (
    <svg
      viewBox={showText ? '0 0 320 80' : '0 0 56 80'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="MktHoney"
    >
      <defs>
        {/* Bright gold vertical gradient — high contrast on dark */}
        <linearGradient id={`gv-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="45%" stopColor="#E6B447" />
          <stop offset="100%" stopColor="#C99A30" />
        </linearGradient>
        {/* Horizontal gradient for text */}
        <linearGradient id={`gh-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C99A30" />
          <stop offset="35%" stopColor="#E6B447" />
          <stop offset="70%" stopColor="#F5D060" />
          <stop offset="100%" stopColor="#E6B447" />
        </linearGradient>
        {/* Drop gradient — solid warm amber */}
        <linearGradient id={`gd-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5D060" />
          <stop offset="40%" stopColor="#E6B447" />
          <stop offset="100%" stopColor="#C48B1A" />
        </linearGradient>
      </defs>

      {showText ? (
        <>
          {/* ====== FUNNEL ICON (left side) ====== */}
          <g transform="translate(0, 2)">
            {/* Outer V */}
            <path
              d="M6 4 L50 4 L31 44 L25 44 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="3"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Middle V */}
            <path
              d="M13 12 L43 12 L31 44 L25 44 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
              opacity="0.85"
            />
            {/* Inner V */}
            <path
              d="M19 19 L37 19 L31 44 L25 44 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              opacity="0.65"
            />

            {/* Drip cross-lines */}
            <line x1="15" y1="22" x2="41" y2="22" stroke={`url(#gh-${id})`} strokeWidth="1.5" opacity="0.55" />
            <line x1="19" y1="29" x2="37" y2="29" stroke={`url(#gh-${id})`} strokeWidth="1.3" opacity="0.45" />
            <line x1="22" y1="36" x2="34" y2="36" stroke={`url(#gh-${id})`} strokeWidth="1.2" opacity="0.35" />

            {/* Stem */}
            <line x1="28" y1="44" x2="28" y2="54" stroke={`url(#gv-${id})`} strokeWidth="2.5" strokeLinecap="round" />

            {/* Honey drop */}
            <path
              d="M28 52 C28 52 22 62 22 67 C22 71 24.7 74 28 74 C31.3 74 34 71 34 67 C34 62 28 52 28 52Z"
              fill={`url(#gd-${id})`}
            />
            {/* Drop shine */}
            <ellipse cx="26" cy="65" rx="2" ry="3" fill="#F5D060" opacity="0.4" />
          </g>

          {/* ====== TEXT ====== */}
          <text
            x="62"
            y="46"
            fontFamily="Satoshi, system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="40"
            letterSpacing="-0.5"
            fill={`url(#gh-${id})`}
          >
            mkthoney
          </text>
          <text
            x="64"
            y="65"
            fontFamily="Satoshi, system-ui, -apple-system, sans-serif"
            fontWeight="500"
            fontSize="11.5"
            letterSpacing="4.5"
            fill="#C99A30"
          >
            MARKETING AGENCY
          </text>
        </>
      ) : (
        /* ====== ICON ONLY (mobile) ====== */
        <>
          <g transform="translate(0, 0)">
            {/* Outer V */}
            <path
              d="M4 4 L52 4 L32 48 L24 48 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="3.5"
              fill="none"
              strokeLinejoin="round"
            />
            {/* Middle V */}
            <path
              d="M12 14 L44 14 L32 48 L24 48 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="3"
              fill="none"
              strokeLinejoin="round"
              opacity="0.85"
            />
            {/* Inner V */}
            <path
              d="M18 22 L38 22 L32 48 L24 48 Z"
              stroke={`url(#gv-${id})`}
              strokeWidth="2.5"
              fill="none"
              strokeLinejoin="round"
              opacity="0.65"
            />

            {/* Drip cross-lines */}
            <line x1="14" y1="26" x2="42" y2="26" stroke={`url(#gh-${id})`} strokeWidth="2" opacity="0.55" />
            <line x1="18" y1="33" x2="38" y2="33" stroke={`url(#gh-${id})`} strokeWidth="1.8" opacity="0.45" />
            <line x1="22" y1="40" x2="34" y2="40" stroke={`url(#gh-${id})`} strokeWidth="1.5" opacity="0.35" />

            {/* Stem */}
            <line x1="28" y1="48" x2="28" y2="58" stroke={`url(#gv-${id})`} strokeWidth="3" strokeLinecap="round" />

            {/* Honey drop */}
            <path
              d="M28 56 C28 56 20 68 20 74 C20 78.5 23.6 80 28 80 C32.4 80 36 78.5 36 74 C36 68 28 56 28 56Z"
              fill={`url(#gd-${id})`}
            />
            {/* Drop shine */}
            <ellipse cx="25" cy="72" rx="2.5" ry="3.5" fill="#F5D060" opacity="0.4" />
          </g>
        </>
      )}
    </svg>
  )
}

export default Logo
