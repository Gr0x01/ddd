import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import { Star, UtensilsCrossed } from 'lucide-react';
import { DISH_CATEGORY_INFO, isValidCategorySlug } from '@/lib/constants/dish-categories';

interface DishCategoryPageProps {
  params: Promise<{ category: string }>;
}

export const revalidate = 3600; // Revalidate every hour

// Pre-render all dish category pages at build time
export async function generateStaticParams() {
  try {
    const categories = await db.getDishCategoriesWithCounts();
    console.log(`✓ Generating ${categories.length} dish category pages`);
    return categories.map((category) => ({
      category: category.slug,
    }));
  } catch (error) {
    console.error('✗ Error generating dish category static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: DishCategoryPageProps): Promise<Metadata> {
  const { category } = await params;

  // Validate slug format and existence
  if (!isValidCategorySlug(category)) {
    return {
      title: 'Category Not Found | Diners, Drive-ins and Dives',
    };
  }

  const info = DISH_CATEGORY_INFO[category];
  if (!info) {
    return {
      title: 'Category Not Found | Diners, Drive-ins and Dives',
    };
  }

  const categoryData = await db.getDishCategoryBySlug(category);
  const count = categoryData?.count || 0;

  const title = `${info.name} Dishes | Diners, Drive-ins and Dives`;
  const description = `Discover ${count} ${info.name.toLowerCase()} dishes featured on Guy Fieri's Diners, Drive-ins and Dives. ${info.description}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/dishes/${category}`,
    },
    openGraph: {
      title: `${info.name} Dishes | Diners, Drive-ins and Dives`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${info.name} Dishes | Diners, Drive-ins and Dives`,
      description,
    },
  };
}

export default async function DishCategoryPage({ params }: DishCategoryPageProps) {
  const { category } = await params;

  // Validate slug format and existence
  if (!isValidCategorySlug(category)) {
    notFound();
  }

  const info = DISH_CATEGORY_INFO[category];
  if (!info) {
    notFound();
  }

  const [dishes, allCategories] = await Promise.all([
    db.getDishesByCategory(category),
    db.getDishCategoriesWithCounts(),
  ]);

  if (dishes.length === 0) {
    notFound();
  }

  // Get related categories (exclude current, sort by count, take top 6)
  const relatedCategories = allCategories
    .filter(c => c.slug !== category)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Dishes', url: '/dishes' },
    { name: info.name },
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
          title={info.name}
          subtitle="Featured Dishes"
          stats={[
            { value: dishes.length, label: 'DISHES' },
          ]}
          breadcrumbItems={[
            { label: 'Dishes', href: '/dishes' },
            { label: info.name }
          ]}
        />

        {/* Category Description */}
        <section className="max-w-6xl mx-auto px-4 pt-12">
          <div className="p-6 rounded-lg mb-8" style={{ background: 'var(--bg-secondary)' }}>
            <p className="font-ui text-lg" style={{ color: 'var(--text-secondary)' }}>
              {info.description}
            </p>
          </div>
        </section>

        {/* Dishes Grid */}
        <main id="main-content" className="max-w-6xl mx-auto px-4 pb-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dishes.map((dish) => (
              <Link
                key={dish.id}
                href={`/dish/${dish.slug}`}
                className="group p-5 rounded-lg transition-all hover:shadow-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}
              >
                {dish.is_signature_dish && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold mb-2"
                    style={{ background: 'var(--accent-primary)', color: 'var(--bg-primary)' }}>
                    <Star size={12} fill="currentColor" />
                    SIGNATURE
                  </div>
                )}
                <h3 className="font-display text-lg font-bold mb-1 group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {dish.name}
                </h3>
                <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  {dish.restaurantCount} restaurant{dish.restaurantCount !== 1 ? 's' : ''}
                </p>
                {dish.guy_reaction && (
                  <p className="font-ui text-sm italic line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    &ldquo;{dish.guy_reaction}&rdquo;
                  </p>
                )}
              </Link>
            ))}
          </div>
        </main>

        {/* Related Categories - Internal Linking */}
        {relatedCategories.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-12">
            <h2 className="font-display text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Explore Other Categories
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {relatedCategories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/dishes/${c.slug}`}
                  className="p-4 rounded-lg text-center transition-all hover:scale-105"
                  style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <span className="font-ui font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>
                    {c.category}
                  </span>
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.count} dishes
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
                <UtensilsCrossed size={16} />
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
