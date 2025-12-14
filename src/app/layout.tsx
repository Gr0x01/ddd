import type { Metadata, Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { PostHogProvider } from "@/components/PostHogProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/schema";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trimpdmap.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Triple D Map | Find Diners, Drive-ins and Dives Locations",
  description: "Discover every restaurant featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map with photos, ratings, and detailed restaurant profiles. Find DDD restaurants near you.",
  keywords: ["diners drive-ins and dives", "triple d", "guy fieri", "ddd restaurants", "flavortown", "food network", "diners", "drive-ins", "dives"],
  authors: [{ name: "Triple D Map" }],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  other: {
    // Block AI training/scraping bots
    'robots': 'noai, noimageai',
    'google-site-verification': 'index, follow, noai',
  },
  openGraph: {
    title: "Triple D Map | Diners, Drive-ins and Dives Restaurant Map",
    description: "Discover every restaurant featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map, photos, and detailed info.",
    type: "website",
    locale: "en_US",
    siteName: "Triple D Map",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Triple D Map | Diners, Drive-ins and Dives",
    description: "Discover every restaurant featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map, photos, and detailed info.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate site-wide structured data
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <html lang="en">
      <head>
        <PlausibleProvider domain="trimpdmap.com" />
        <link rel="preconnect" href="https://clktrvyieegouggrpfaj.supabase.co" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />

        {/* Schema.org Structured Data for entire site */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
