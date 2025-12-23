import { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { UtensilsCrossed, Star, Quote } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export const metadata: Metadata = {
  title: 'Featured Dishes | Diners, Drive-ins and Dives',
  description: 'Explore the legendary dishes featured on Guy Fieri\'s Diners, Drive-ins and Dives. From signature plates to Guy\'s favorites - find what to order.',
  alternates: {
    canonical: '/dishes',
  },
  openGraph: {
    title: 'Featured Dishes | Diners, Drive-ins and Dives',
    description: 'Explore the legendary dishes featured on Guy Fieri\'s Diners, Drive-ins and Dives.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Featured Dishes | Diners, Drive-ins and Dives',
    description: 'Explore the legendary dishes featured on Guy Fieri\'s Diners, Drive-ins and Dives.',
  },
};

export default async function DishesPage() {
  const [dishes, categories] = await Promise.all([
    db.getDishesWithCounts(false),
    db.getDishCategoriesWithCounts(),
  ]);

  // Get signature dishes
  const signatureDishes = dishes.filter(d => d.is_signature_dish);

  return (
    <>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Featured Dishes"
          subtitle="Diners, Drive-ins and Dives"
          stats={[
            { value: dishes.length, label: 'DISHES' },
            { value: signatureDishes.length, label: 'SIGNATURE' }
          ]}
        />

        <main id="main-content" className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              From Guy Fieri&apos;s legendary reactions to signature plates that put restaurants on the map.
              Discover what to order at your next Triple D destination.
            </p>
          </div>

          {/* Browse by Category */}
          {categories.length > 0 && (
            <section className="mb-12">
              <h2
                className="font-display text-2xl font-bold mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                Browse by Category
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/dishes/${cat.slug}`}
                    className="p-4 rounded-lg text-center transition-all hover:scale-105 hover:shadow-md"
                    style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                  >
                    <span className="font-ui font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                      {cat.category}
                    </span>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {cat.count} dishes
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Signature Dishes Section */}
          {signatureDishes.length > 0 && (
            <section className="mb-12">
              <h2
                className="font-display text-2xl font-bold mb-6 flex items-center gap-2"
                style={{ color: 'var(--text-primary)' }}
              >
                <Star className="w-6 h-6" style={{ color: 'var(--ddd-yellow)' }} fill="var(--ddd-yellow)" />
                Signature Dishes
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {signatureDishes.slice(0, 12).map((dish) => (
                  <DishCard key={dish.id} dish={dish} featured />
                ))}
              </div>
              {signatureDishes.length > 12 && (
                <p className="mt-4 text-center font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                  + {signatureDishes.length - 12} more signature dishes below
                </p>
              )}
            </section>
          )}

          {/* All Dishes */}
          <section>
            <h2
              className="font-display text-2xl font-bold mb-6 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <UtensilsCrossed className="w-6 h-6" style={{ color: 'var(--ddd-red)' }} />
              All Featured Dishes
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </section>
        </main>
      </div>
      <Footer />
    </>
  );
}

function DishCard({
  dish,
  featured = false
}: {
  dish: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    guy_reaction: string | null;
    is_signature_dish: boolean;
    restaurantCount: number;
  };
  featured?: boolean;
}) {
  return (
    <Link
      href={`/dish/${dish.slug}`}
      className="p-5 rounded-lg block transition-all group hover:shadow-lg"
      style={{
        background: featured ? 'var(--warm-cream)' : 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)',
        border: featured ? '2px solid var(--ddd-yellow)' : '2px solid transparent',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3
          className="font-display text-lg font-bold group-hover:underline"
          style={{ color: 'var(--text-primary)' }}
        >
          {dish.name}
        </h3>
        {dish.is_signature_dish && (
          <Star
            className="w-4 h-4 flex-shrink-0 ml-2"
            style={{ color: 'var(--ddd-yellow)' }}
            fill="var(--ddd-yellow)"
          />
        )}
      </div>

      {dish.guy_reaction && (
        <div className="mb-3 flex items-start gap-2">
          <Quote className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: 'var(--ddd-red)' }} />
          <p
            className="font-ui text-sm italic line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {dish.guy_reaction}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span
          className="font-mono text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {dish.restaurantCount} {dish.restaurantCount === 1 ? 'restaurant' : 'restaurants'}
        </span>
        <span
          className="font-mono text-xs px-2 py-0.5"
          style={{ background: 'var(--accent-primary)', color: 'white' }}
        >
          VIEW
        </span>
      </div>
    </Link>
  );
}
