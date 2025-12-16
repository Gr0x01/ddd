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
          backgroundColor: '#1a1a1a',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Green accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#22c55e',
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
              backgroundColor: '#22c55e',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '32px',
            }}
          >
            VERIFIED OPEN
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#22c55e',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            {openCount.toLocaleString()}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            Restaurants Still Open
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
              color: '#FFC72C',
              marginBottom: '48px',
            }}
          >
            Diners, Drive-ins and Dives
          </div>

          {/* Trust signal */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(34,197,94,0.1)',
              padding: '16px 32px',
              borderRadius: '12px',
              border: '2px solid rgba(34,197,94,0.3)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              ✓
            </div>
            <div style={{ display: 'flex', fontSize: '20px', color: '#ffffff' }}>
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
