import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'MKVCinemas – Download Movies & Web Series in HD';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 40%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          padding: '48px',
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              background: '#dc2626',
              color: '#ffffff',
              fontSize: '56px',
              fontWeight: 900,
              padding: '10px 28px',
              borderRadius: '10px',
              letterSpacing: '-1px',
            }}
          >
            MKV
          </div>
          <span style={{ color: '#ffffff', fontSize: '72px', fontWeight: 900, letterSpacing: '-2px' }}>
            Cinemas
          </span>
        </div>

        {/* Tagline */}
        <p style={{ color: '#d4d4d4', fontSize: '34px', margin: '0', textAlign: 'center', lineHeight: '1.3' }}>
          Download Movies &amp; Web Series in HD
        </p>

        {/* Quality badges */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '28px' }}>
          {['480p', '720p', '1080p', '4K', 'Dual Audio', 'Free'].map((badge) => (
            <div
              key={badge}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#a3a3a3',
                fontSize: '20px',
                fontWeight: 600,
                padding: '6px 18px',
                borderRadius: '6px',
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        {/* Domain */}
        <p style={{ color: '#525252', fontSize: '20px', marginTop: '32px' }}>
          mkvcinemas.world
        </p>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
