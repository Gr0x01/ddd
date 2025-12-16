import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { db } from '@/lib/supabase';

export const metadata = {
  title: 'Diners, Drive-ins and Dives Restaurants by State | Guy Fieri Locations',
  description: 'Complete list of Diners, Drive-ins and Dives restaurants organized by state. Find Guy Fieri-featured locations across the US, Canada, and internationally.',
  alternates: {
    canonical: '/states',
  },
  openGraph: {
    title: 'Diners, Drive-ins and Dives Restaurants by State',
    description: 'Browse all Guy Fieri-featured restaurants by state across the US, Canada, and internationally.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Diners, Drive-ins and Dives Restaurants by State',
    description: 'Browse all Guy Fieri-featured restaurants by state.',
  },
};

export const revalidate = 3600; // Revalidate every hour

// Map abbreviations to full names and countries
const STATE_INFO: Record<string, { name: string; country: 'USA' | 'Canada' | 'International' }> = {
  // US States
  'AL': { name: 'Alabama', country: 'USA' },
  'AK': { name: 'Alaska', country: 'USA' },
  'AZ': { name: 'Arizona', country: 'USA' },
  'AR': { name: 'Arkansas', country: 'USA' },
  'CA': { name: 'California', country: 'USA' },
  'CO': { name: 'Colorado', country: 'USA' },
  'CT': { name: 'Connecticut', country: 'USA' },
  'DE': { name: 'Delaware', country: 'USA' },
  'FL': { name: 'Florida', country: 'USA' },
  'GA': { name: 'Georgia', country: 'USA' },
  'HI': { name: 'Hawaii', country: 'USA' },
  'ID': { name: 'Idaho', country: 'USA' },
  'IL': { name: 'Illinois', country: 'USA' },
  'IN': { name: 'Indiana', country: 'USA' },
  'IA': { name: 'Iowa', country: 'USA' },
  'KS': { name: 'Kansas', country: 'USA' },
  'KY': { name: 'Kentucky', country: 'USA' },
  'LA': { name: 'Louisiana', country: 'USA' },
  'ME': { name: 'Maine', country: 'USA' },
  'MD': { name: 'Maryland', country: 'USA' },
  'MA': { name: 'Massachusetts', country: 'USA' },
  'MI': { name: 'Michigan', country: 'USA' },
  'MN': { name: 'Minnesota', country: 'USA' },
  'MS': { name: 'Mississippi', country: 'USA' },
  'MO': { name: 'Missouri', country: 'USA' },
  'MT': { name: 'Montana', country: 'USA' },
  'NE': { name: 'Nebraska', country: 'USA' },
  'NV': { name: 'Nevada', country: 'USA' },
  'NH': { name: 'New Hampshire', country: 'USA' },
  'NJ': { name: 'New Jersey', country: 'USA' },
  'NM': { name: 'New Mexico', country: 'USA' },
  'NY': { name: 'New York', country: 'USA' },
  'NC': { name: 'North Carolina', country: 'USA' },
  'ND': { name: 'North Dakota', country: 'USA' },
  'OH': { name: 'Ohio', country: 'USA' },
  'OK': { name: 'Oklahoma', country: 'USA' },
  'OR': { name: 'Oregon', country: 'USA' },
  'PA': { name: 'Pennsylvania', country: 'USA' },
  'RI': { name: 'Rhode Island', country: 'USA' },
  'SC': { name: 'South Carolina', country: 'USA' },
  'SD': { name: 'South Dakota', country: 'USA' },
  'TN': { name: 'Tennessee', country: 'USA' },
  'TX': { name: 'Texas', country: 'USA' },
  'UT': { name: 'Utah', country: 'USA' },
  'VT': { name: 'Vermont', country: 'USA' },
  'VA': { name: 'Virginia', country: 'USA' },
  'WA': { name: 'Washington', country: 'USA' },
  'WV': { name: 'West Virginia', country: 'USA' },
  'WI': { name: 'Wisconsin', country: 'USA' },
  'WY': { name: 'Wyoming', country: 'USA' },
  'DC': { name: 'Washington D.C.', country: 'USA' },
  'PR': { name: 'Puerto Rico', country: 'USA' },
  // Canada
  'AB': { name: 'Alberta', country: 'Canada' },
  'BC': { name: 'British Columbia', country: 'Canada' },
  'ON': { name: 'Ontario', country: 'Canada' },
  // International
  'Sicily': { name: 'Sicily, Italy', country: 'International' },
};

interface StateWithCount {
  abbreviation: string;
  name: string;
  slug: string;
  count: number;
  country: 'USA' | 'Canada' | 'International';
}

export default async function StatesPage() {
  // Use efficient aggregation query instead of fetching ALL restaurants
  const stateCounts = await db.getRestaurantCountsByState();
  const totalRestaurants = stateCounts.reduce((sum, s) => sum + s.count, 0);

  // Convert to lookup object
  const restaurantCountByState: Record<string, number> = {};
  stateCounts.forEach(({ state, count }) => {
    restaurantCountByState[state] = count;
  });

  // Helper to generate slug matching states table
  const generateStateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars (periods, commas)
      .replace(/\s+/g, '-')          // Replace spaces with hyphens
      .replace(/-+/g, '-')           // Collapse multiple hyphens
      .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
  };

  // Build state list with full names and country grouping
  const allStates: StateWithCount[] = Object.entries(restaurantCountByState)
    .filter(([abbr]) => abbr && STATE_INFO[abbr])
    .map(([abbr, count]) => ({
      abbreviation: abbr,
      name: STATE_INFO[abbr].name,
      // Generate slug from full state name (matches states table)
      slug: generateStateSlug(STATE_INFO[abbr].name),
      count,
      country: STATE_INFO[abbr].country,
    }));

  // Group by country
  const usaStates = allStates.filter(s => s.country === 'USA').sort((a, b) => a.name.localeCompare(b.name));
  const canadaStates = allStates.filter(s => s.country === 'Canada').sort((a, b) => a.name.localeCompare(b.name));
  const internationalStates = allStates.filter(s => s.country === 'International').sort((a, b) => a.name.localeCompare(b.name));

  const usaCount = usaStates.reduce((sum, s) => sum + s.count, 0);
  const canadaCount = canadaStates.reduce((sum, s) => sum + s.count, 0);
  const internationalCount = internationalStates.reduce((sum, s) => sum + s.count, 0);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="states" />
        <PageHero
          title="Browse by State"
          subtitle="Diners, Drive-ins and Dives restaurants across the US, Canada, and beyond"
          stats={[
            { value: allStates.length, label: 'LOCATIONS' },
            { value: totalRestaurants || 0, label: 'RESTAURANTS' }
          ]}
          breadcrumbItems={[{ label: 'States' }]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12 space-y-16">

          {/* United States Section */}
          {usaStates.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  United States
                </h2>
                <p className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                  {usaStates.length} states · {usaCount.toLocaleString()} restaurants
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usaStates.map((state) => (
                  <CategoryCard
                    key={state.abbreviation}
                    href={`/state/${state.slug}`}
                    title={state.name}
                    count={state.count}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Canada Section */}
          {canadaStates.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Canada
                </h2>
                <p className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                  {canadaStates.length} provinces · {canadaCount.toLocaleString()} restaurants
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canadaStates.map((state) => (
                  <CategoryCard
                    key={state.abbreviation}
                    href={`/state/${state.slug}`}
                    title={state.name}
                    count={state.count}
                  />
                ))}
              </div>
            </section>
          )}

          {/* International Section */}
          {internationalStates.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="font-display text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  International
                </h2>
                <p className="font-ui text-sm" style={{ color: 'var(--text-muted)' }}>
                  {internationalStates.length} locations · {internationalCount.toLocaleString()} restaurants
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {internationalStates.map((state) => (
                  <CategoryCard
                    key={state.abbreviation}
                    href={`/state/${state.slug}`}
                    title={state.name}
                    count={state.count}
                  />
                ))}
              </div>
            </section>
          )}

          {allStates.length === 0 && (
            <div className="text-center py-12">
              <p className="font-ui text-lg" style={{ color: 'var(--text-muted)' }}>
                No locations with restaurants found.
              </p>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
