import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MKTHONEY — Autonomous Marketing Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(230, 180, 71, 0.15), transparent)',
        }}
      >
        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '80px',
              fontWeight: 900,
              color: '#E6B447',
              letterSpacing: '-2px',
              lineHeight: 1,
            }}
          >
            mkthoney
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 500,
              color: '#C99A30',
              letterSpacing: '6px',
              textTransform: 'uppercase' as const,
            }}
          >
            AUTONOMOUS MARKETING
          </div>
          <div
            style={{
              marginTop: '24px',
              fontSize: '28px',
              color: '#a1a1aa',
              maxWidth: '700px',
              textAlign: 'center' as const,
              lineHeight: 1.4,
            }}
          >
            Inteligência de marketing autônoma para escalar seu negócio
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '4px',
            background: 'linear-gradient(90deg, transparent, #E6B447, transparent)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
