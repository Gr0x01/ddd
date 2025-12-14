import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { RestaurantCardCompact } from '@/components/restaurant/RestaurantCardCompact';
import { generateBreadcrumbSchema, generateItemListSchema, safeStringifySchema } from '@/lib/schema';

interface CuisinePageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: CuisinePageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const cuisine = await db.getCuisine(slug);
    const restaurants = await db.getRestaurantsByCuisine(slug);
    const openCount = restaurants.filter(r => r.status === 'open').length;

    const title = `${restaurants.length} ${cuisine.name} Restaurants | Diners, Drive-ins and Dives`;
    const description = cuisine.meta_description ||
      `Discover ${restaurants.length} ${cuisine.name.toLowerCase()} restaurants featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open. View photos, ratings, and locations.`;

    return {
      title,
      description,
      openGraph: {
        title: `${cuisine.name} Restaurants | Diners, Drive-ins and Dives`,
        description,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${cuisine.name} | Diners, Drive-ins and Dives`,
        description,
      },
    };
  } catch (error) {
    console.error('Cuisine page metadata generation failed:', error);
    return {
      title: 'Cuisine Not Found | Diners, Drive-ins and Dives',
    };
  }
}

export default async function CuisinePage({ params }: CuisinePageProps) {
  const { slug } = await params;

  let cuisine;
  let restaurants;
  try {
    cuisine = await db.getCuisine(slug);
    restaurants = await db.getRestaurantsByCuisine(slug);
  } catch (error) {
    console.error('Error loading cuisine page:', error);
    notFound();
  }

  const openRestaurants = restaurants.filter(r => r.status === 'open');
  const closedRestaurants = restaurants.filter(r => r.status === 'closed');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Cuisines', url: '/cuisines' },
    { name: cuisine.name },
  ]);

  const itemListSchema = generateItemListSchema(
    openRestaurants,
    `${cuisine.name} Restaurants - Diners, Drive-ins and Dives`,
    `/cuisines/${slug}`
  );

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(itemListSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title={cuisine.name}
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'Cuisines', href: '/cuisines' },
            { label: cuisine.name }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          {cuisine.description && (
            <div className="mb-8 p-6 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
                {cuisine.description}
              </p>
            </div>
          )}

          {restaurants.length === 0 ? (
            <div className="p-8 rounded-lg text-center" style={{ background: 'var(--bg-secondary)' }}>
              <p className="font-ui text-xl" style={{ color: 'var(--text-muted)' }}>
                No {cuisine.name.toLowerCase()} restaurants found yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Open Restaurants */}
              {openRestaurants.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Open Now ({openRestaurants.length})
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {openRestaurants
                      .sort((a, b) => (b.google_rating || 0) - (a.google_rating || 0))
                      .map((restaurant) => (
                        <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
                      ))}
                  </div>
                </section>
              )}

              {/* Closed Restaurants */}
              {closedRestaurants.length > 0 && (
                <section className="mt-12">
                  <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Closed ({closedRestaurants.length})
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
                    {closedRestaurants.map((restaurant) => (
                      <RestaurantCardCompact key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
