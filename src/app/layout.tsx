import type { Metadata, Viewport } from "next";
import PlausibleProvider from "next-plausible";
import { PostHogProvider } from "@/components/PostHogProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { generateOrganizationSchema, generateWebSiteSchema, safeStringifySchema } from "@/lib/schema";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.tripledmap.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "Diners, Drive-ins and Dives Locations | Find Every Restaurant Featured by Guy Fieri",
  description: "Discover every restaurant featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map with photos, ratings, and detailed restaurant profiles. Find Diners, Drive-ins and Dives restaurants near you.",
  keywords: ["diners drive-ins and dives", "guy fieri restaurants", "diners drive-ins dives locations", "flavortown", "food network", "triple d", "ddd restaurants"],
  authors: [{ name: "Diners, Drive-ins and Dives Map" }],
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
    title: "Diners, Drive-ins and Dives Restaurant Locations | Guy Fieri Map",
    description: "Discover every restaurant featured on Guy Fieri's Diners, Drive-ins and Dives. Interactive map, photos, and detailed info.",
    type: "website",
    locale: "en_US",
    siteName: "Diners, Drive-ins and Dives Map",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Diners, Drive-ins and Dives Locations | Guy Fieri",
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
        <PlausibleProvider domain="tripledmap.com" />
        <link rel="preconnect" href="https://clktrvyieegouggrpfaj.supabase.co" />
        <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="https://upload.wikimedia.org" />

        {/* Schema.org Structured Data for entire site */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStringifySchema(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStringifySchema(websiteSchema) }}
        />
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
