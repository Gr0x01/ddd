import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { FilterableRestaurantList } from '@/components/restaurant/FilterableRestaurantList';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { Quote, Star, UtensilsCrossed } from 'lucide-react';

interface DishPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata({ params }: DishPageProps): Promise<Metadata> {
  const { slug } = await params;

  const dish = await db.getDishBySlug(slug);
  if (!dish) {
    return { title: 'Dish Not Found | Diners, Drive-ins and Dives' };
  }

  const restaurants = await db.getRestaurantsByDish(slug);
  const openCount = restaurants.filter(r => r.status === 'open').length;

  const title = `${dish.name} | Diners, Drive-ins and Dives`;
  const description = dish.guy_reaction
    ? `"${dish.guy_reaction}" - Guy Fieri on ${dish.name}. Find ${restaurants.length} restaurants serving this dish, ${openCount} still open.`
    : `Discover ${restaurants.length} restaurants serving ${dish.name}, featured on Guy Fieri's Diners, Drive-ins and Dives. ${openCount} still open.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/dish/${slug}`,
    },
    openGraph: {
      title: `${dish.name} | Diners, Drive-ins and Dives`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${dish.name} | Diners, Drive-ins and Dives`,
      description,
    },
  };
}

export default async function DishPage({ params }: DishPageProps) {
  const { slug } = await params;

  const dish = await db.getDishBySlug(slug);
  if (!dish) {
    notFound();
  }

  const [restaurants, statesData, citiesData, allDishes] = await Promise.all([
    db.getRestaurantsByDish(slug),
    db.getStatesWithCounts(),
    db.getCitiesWithCounts(),
    db.getDishesWithCounts(false),
  ]);

  const states = statesData.map((s: { name: string; abbreviation: string; restaurant_count?: number }) => ({
    name: s.name,
    abbreviation: s.abbreviation,
    count: s.restaurant_count ?? 0,
  }));

  const cities = citiesData.map((c: { name: string; state_name: string; restaurant_count?: number }) => ({
    name: c.name,
    state: c.state_name,
    count: c.restaurant_count ?? 0,
  }));

  // Get related dishes (similar restaurant count range, exclude current)
  const relatedDishes = allDishes
    .filter(d => d.slug !== slug)
    .slice(0, 8);

  const openRestaurants = restaurants.filter(r => r.status === 'open');

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Dishes', url: '/dishes' },
    { name: dish.name },
  ]);

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title={dish.name}
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: restaurants.length, label: 'RESTAURANTS' },
            { value: openRestaurants.length, label: 'OPEN' }
          ]}
          breadcrumbItems={[
            { label: 'Dishes', href: '/dishes' },
            { label: dish.name }
          ]}
        />

        {/* Dish Info */}
        <section className="max-w-6xl mx-auto px-4 pt-12">
          <div
            className="p-6 rounded-lg mb-8"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--ddd-yellow)' }}
              >
                <UtensilsCrossed className="w-7 h-7" style={{ color: 'var(--ddd-black)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {dish.name}
                  </h2>
                  {dish.is_signature_dish && (
                    <span
                      className="flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--ddd-yellow)', color: 'var(--ddd-black)' }}
                    >
                      <Star className="w-3 h-3" fill="currentColor" />
                      SIGNATURE
                    </span>
                  )}
                </div>

                {dish.guy_reaction && (
                  <div className="flex items-start gap-2 mt-3">
                    <Quote className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: 'var(--ddd-red)' }} />
                    <p
                      className="font-ui text-lg italic"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      "{dish.guy_reaction}"
                    </p>
                  </div>
                )}

                {dish.description && (
                  <p className="font-ui mt-3" style={{ color: 'var(--text-secondary)' }}>
                    {dish.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Restaurants */}
        {restaurants.length > 0 && (
          <>
            <section className="max-w-6xl mx-auto px-4 pb-4">
              <h2
                className="font-display text-2xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Where to Get It
              </h2>
              <p className="font-ui mt-2" style={{ color: 'var(--text-secondary)' }}>
                {restaurants.length} {restaurants.length === 1 ? 'restaurant serves' : 'restaurants serve'} {dish.name}
              </p>
            </section>

            <FilterableRestaurantList
              restaurants={restaurants}
              states={states}
              cities={cities}
              emptyMessage={`No restaurants found serving ${dish.name}.`}
            />
          </>
        )}

        {/* Related Dishes */}
        {relatedDishes.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Explore Other Dishes
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {relatedDishes.map((d) => (
                <Link
                  key={d.id}
                  href={`/dish/${d.slug}`}
                  className="p-4 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <span className="font-ui font-semibold block mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {d.name}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {d.restaurantCount} {d.restaurantCount === 1 ? 'restaurant' : 'restaurants'}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/dishes"
                className="inline-flex items-center gap-2 font-mono text-sm font-semibold px-6 py-3 transition-colors"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                VIEW ALL DISHES
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </section>
        )}
      </div>
      <Footer />
    </>
  );
}
