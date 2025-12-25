import { Metadata } from 'next';
import { db, getCachedRestaurantStats, RestaurantWithEpisodes } from '@/lib/supabase';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';
import { generateBreadcrumbSchema, safeStringifySchema } from '@/lib/schema';
import NearMeClient from './NearMeClient';

export const revalidate = 3600; // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getCachedRestaurantStats();

  const title = `Diners, Drive-ins and Dives Near Me | Find Triple D Restaurants`;
  const description = `Find Guy Fieri's Diners, Drive-ins and Dives restaurants near your location. ${stats.open} Triple D restaurants still open across the US. Use your location to discover nearby spots.`;

  return {
    title,
    description,
    alternates: {
      canonical: '/near-me',
    },
    openGraph: {
      title: `Triple D Restaurants Near Me`,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Diners, Drive-ins and Dives Near Me`,
      description,
    },
  };
}

export default async function NearMePage() {
  // Fetch all open restaurants with coordinates for client-side distance calculation
  const restaurants = await db.getRestaurants();
  const openRestaurants = restaurants
    .filter(r => r.status === 'open' && r.latitude && r.longitude)
    .map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      city: r.city,
      state: r.state,
      latitude: r.latitude!,
      longitude: r.longitude!,
      price_tier: r.price_tier,
      google_rating: r.google_rating,
      google_review_count: r.google_review_count,
      photo_url: r.photo_url,
      photos: r.photos,
      cuisines: (r as RestaurantWithEpisodes).cuisines || [],
    }));

  const uniqueStates = new Set(openRestaurants.map(r => r.state).filter(Boolean));

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Near Me' },
  ]);

  // FAQ schema for near me queries
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I find Triple D restaurants near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Allow location access on this page to automatically find Diners, Drive-ins and Dives restaurants closest to you. We\'ll show you the nearest Triple D spots sorted by distance, so you can plan your visit.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are there any Diners, Drive-ins and Dives restaurants near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Guy Fieri has visited over ${openRestaurants.length} restaurants that are still open today. Enable location services to find which ones are closest to you.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeStringifySchema(faqSchema) }}
      />

      <div className="min-h-screen" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <Header currentPage="restaurants" />

        <PageHero
          title="Near Me"
          subtitle="Find Triple D Restaurants by Location"
          description="Use your location to find the closest Diners, Drive-ins and Dives restaurants. We'll sort by distance so you can plan your next visit."
          stats={[
            { value: openRestaurants.length, label: 'OPEN' },
            { value: uniqueStates.size, label: 'STATES' }
          ]}
          breadcrumbItems={[
            { label: 'Near Me' }
          ]}
        />

        <NearMeClient restaurants={openRestaurants} />
      </div>
      <Footer />
    </>
  );
}
