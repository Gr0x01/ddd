import { ImageResponse } from 'next/og';
import { db } from '@/lib/supabase';

export const runtime = 'edge';

export const alt = 'Diners, Drive-ins and Dives Locations - Plan Your Guy Fieri Road Trip';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  let stats = { restaurants: 1541, cities: 300, openRestaurants: 1151 };

  try {
    const dbStats = await db.getStats();
    stats.restaurants = dbStats.restaurants;
    stats.cities = dbStats.cities;
    stats.openRestaurants = dbStats.openRestaurants;
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
          backgroundColor: '#FFC72C',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #FFC72C 0%, #FFB800 100%)',
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
            position: 'relative',
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
              marginBottom: '24px',
            }}
          >
            TRIPLE D MAP
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              Diners, Drive-ins
            </div>
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#1a1a1a',
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              and Dives
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '28px',
              color: '#1a1a1a',
              marginBottom: '48px',
              opacity: 0.8,
            }}
          >
            Plan Your Guy Fieri Road Trip
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
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '20px 40px',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {stats.restaurants.toLocaleString()}
              </div>
              <div style={{ display: 'flex', fontSize: '16px', color: '#1a1a1a', opacity: 0.7, letterSpacing: '2px' }}>
                RESTAURANTS
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '20px 40px',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {stats.openRestaurants.toLocaleString()}
              </div>
              <div style={{ display: 'flex', fontSize: '16px', color: '#1a1a1a', opacity: 0.7, letterSpacing: '2px' }}>
                STILL OPEN
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '20px 40px',
                borderRadius: '12px',
              }}
            >
              <div style={{ display: 'flex', fontSize: '48px', fontWeight: 'bold', color: '#1a1a1a' }}>
                {stats.cities}+
              </div>
              <div style={{ display: 'flex', fontSize: '16px', color: '#1a1a1a', opacity: 0.7, letterSpacing: '2px' }}>
                CITIES
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
