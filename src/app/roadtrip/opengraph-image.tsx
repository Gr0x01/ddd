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
            PLAN YOUR TRIP
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 80,
              fontWeight: 900,
              color: '#1A1A1D',
              lineHeight: 1.05,
              letterSpacing: -1,
              marginBottom: 20,
            }}
          >
            Road Trip Planner
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
            Find Guy Fieri restaurants along your route
          </div>

          {/* Route example in black box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1A1A1D',
              padding: '24px 48px',
              gap: 32,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              Los Angeles
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                color: '#FFCB47',
              }}
            >
              →
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
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
