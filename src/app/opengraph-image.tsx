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
            TRIPLE D MAP
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                fontWeight: 900,
                color: '#1A1A1D',
                lineHeight: 1.05,
                letterSpacing: -1,
              }}
            >
              Diners, Drive-ins
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 72,
                fontWeight: 900,
                color: '#1A1A1D',
                lineHeight: 1.05,
                letterSpacing: -1,
              }}
            >
              and Dives
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: '#1A1A1D',
              marginBottom: 40,
              opacity: 0.75,
            }}
          >
            Plan Your Guy Fieri Road Trip
          </div>

          {/* Stats in black box */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1A1A1D',
              padding: '28px 48px',
              gap: 56,
              borderRadius: 8,
            }}
          >
            {/* Stat 1 */}
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
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {stats.restaurants.toLocaleString()}
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
                RESTAURANTS
              </div>
            </div>

            {/* Stat 2 */}
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
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#10b981',
                  lineHeight: 1,
                }}
              >
                {stats.openRestaurants.toLocaleString()}
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
                STILL OPEN
              </div>
            </div>

            {/* Stat 3 */}
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
                  fontSize: 52,
                  fontWeight: 900,
                  color: '#ffffff',
                  lineHeight: 1,
                }}
              >
                {stats.cities}+
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
