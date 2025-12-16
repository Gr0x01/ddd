import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Road Trip Planner - Diners, Drive-ins and Dives';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
          backgroundColor: '#FFC72C',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Road graphic */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '120px',
            backgroundColor: '#333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Road markings */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                style={{
                  width: '60px',
                  height: '8px',
                  backgroundColor: '#FFC72C',
                  borderRadius: '4px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px',
            marginBottom: '60px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#1a1a1a',
              color: '#FFC72C',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: 'bold',
              letterSpacing: '2px',
              marginBottom: '32px',
            }}
          >
            PLAN YOUR TRIP
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#1a1a1a',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            Road Trip Planner
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              color: '#1a1a1a',
              opacity: 0.8,
              marginBottom: '48px',
            }}
          >
            Find Guy Fieri restaurants along your route
          </div>

          {/* Route example */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: '20px 40px',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
              Los Angeles
            </div>
            <div style={{ display: 'flex', fontSize: '32px', color: '#1a1a1a' }}>→</div>
            <div style={{ display: 'flex', fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>
              Las Vegas
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
