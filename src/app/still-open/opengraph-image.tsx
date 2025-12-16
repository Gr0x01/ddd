import { ImageResponse } from 'next/og';
import { getCachedRestaurantsByStatus } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'Diners, Drive-ins and Dives Restaurants Still Open';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  let openCount = 1151;

  try {
    const restaurants = await getCachedRestaurantsByStatus('open');
    openCount = restaurants.length;
  } catch {
    // Use default
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
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '12px 28px',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 3,
              marginBottom: 32,
            }}
          >
            VERIFIED OPEN
          </div>

          {/* Big number */}
          <div
            style={{
              display: 'flex',
              fontSize: 120,
              fontWeight: 900,
              color: '#1A1A1D',
              lineHeight: 1,
              marginBottom: 8,
            }}
          >
            {openCount.toLocaleString()}
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 48,
              fontWeight: 900,
              color: '#1A1A1D',
              lineHeight: 1.1,
              marginBottom: 20,
            }}
          >
            Restaurants Still Open
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

          {/* Trust signal in black box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1A1A1D',
              padding: '20px 36px',
              gap: 16,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                backgroundColor: '#10b981',
                borderRadius: 14,
                color: '#ffffff',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              ✓
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 20,
                color: '#ffffff',
              }}
            >
              Status verified regularly
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
