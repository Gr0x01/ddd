import { ImageResponse } from 'next/og';
import { getCachedRestaurantStats } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'All Diners, Drive-ins and Dives Restaurants';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  let stats = { total: 1541, open: 1151 };

  try {
    const dbStats = await getCachedRestaurantStats();
    stats.total = dbStats.total;
    stats.open = dbStats.open;
  } catch {
    // Use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a1a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#FFC72C',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#FFC72C',
              color: '#1a1a1a',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '32px',
            }}
          >
            COMPLETE DATABASE
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            All {stats.total.toLocaleString()} Restaurants
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              color: '#FFC72C',
              marginBottom: '48px',
            }}
          >
            Diners, Drive-ins and Dives
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255,199,44,0.1)',
                padding: '24px 48px',
                borderRadius: '12px',
                border: '2px solid rgba(255,199,44,0.3)',
              }}
            >
              <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: '#FFC72C' }}>
                {stats.open.toLocaleString()}
              </div>
              <div style={{ display: 'flex', fontSize: '18px', color: '#ffffff', opacity: 0.7, letterSpacing: '2px' }}>
                VERIFIED OPEN
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255,199,44,0.1)',
                padding: '24px 48px',
                borderRadius: '12px',
                border: '2px solid rgba(255,199,44,0.3)',
              }}
            >
              <div style={{ display: 'flex', fontSize: '56px', fontWeight: 'bold', color: '#FFC72C' }}>
                {(stats.total - stats.open).toLocaleString()}
              </div>
              <div style={{ display: 'flex', fontSize: '18px', color: '#ffffff', opacity: 0.7, letterSpacing: '2px' }}>
                CLOSED
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
