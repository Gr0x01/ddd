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
          backgroundColor: '#FFCB47',
          position: 'relative',
        }}
      >
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 60,
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1A1A1D',
              color: '#FFCB47',
              padding: '12px 28px',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 32,
            }}
          >
            COMPLETE DATABASE
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 900,
              color: '#1A1A1D',
              lineHeight: 1.05,
              letterSpacing: -1,
              marginBottom: 20,
            }}
          >
            All {stats.total.toLocaleString()} Restaurants
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#1A1A1D',
              marginBottom: 48,
              opacity: 0.75,
            }}
          >
            Diners, Drive-ins and Dives
          </div>

          {/* Stats in black box */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1A1A1D',
              padding: '28px 56px',
              gap: 64,
              borderRadius: 8,
            }}
          >
            {/* Stat 1 - Open */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#10b981',
                  lineHeight: 1,
                }}
              >
                {stats.open.toLocaleString()}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 13,
                  color: '#10b981',
                  letterSpacing: 2,
                  marginTop: 6,
                }}
              >
                VERIFIED OPEN
              </div>
            </div>

            {/* Stat 2 - Closed */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {(stats.total - stats.open).toLocaleString()}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: 13,
                  color: '#FFCB47',
                  letterSpacing: 2,
                  marginTop: 6,
                }}
              >
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
