import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { PageHero } from '@/components/ui/PageHero';

export const metadata = {
  title: 'Privacy Policy | Triple D Map',
  description: 'Privacy policy for Triple D Map - how we collect, use, and protect your information.',
};

export default function PrivacyPage() {
  return (
    <>
      <Header currentPage="about" />
      <div className="min-h-screen overflow-auto" style={{ background: 'var(--bg-primary)', paddingTop: '64px' }}>
        <PageHero
          title="Privacy Policy"
          subtitle="How we handle your data"
          breadcrumbItems={[{ label: 'Privacy Policy' }]}
        />

        <main id="main-content" className="max-w-4xl mx-auto px-4 py-12">
          <div className="space-y-8">
            <section>
              <p className="font-ui text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Last Updated: December 14, 2025
              </p>
              <p className="font-ui text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Triple D Map ("we", "our", or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information
                when you visit our website.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Analytics Data
                  </h3>
                  <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    We use analytics services (Google Analytics, PostHog, Plausible) to understand
                    how visitors use our site. This includes:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 font-ui" style={{ color: 'var(--text-secondary)' }}>
                    <li>Pages visited and time spent on site</li>
                    <li>Browser type and device information</li>
                    <li>General location data (city/state level)</li>
                    <li>Referral sources</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-display text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Cookies
                  </h3>
                  <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    We use cookies to improve your experience and for analytics purposes. You can
                    disable cookies in your browser settings, though some features may not work properly.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                How We Use Your Information
              </h2>
              <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We use collected information to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 font-ui" style={{ color: 'var(--text-secondary)' }}>
                <li>Improve our website and user experience</li>
                <li>Understand which features are most useful</li>
                <li>Monitor site performance and fix issues</li>
                <li>Analyze traffic patterns and trends</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Third-Party Services
              </h2>
              <p className="font-ui leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                We use the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-1 font-ui" style={{ color: 'var(--text-secondary)' }}>
                <li><strong>Google Analytics</strong> - Web analytics</li>
                <li><strong>PostHog</strong> - Product analytics and session recording</li>
                <li><strong>Plausible Analytics</strong> - Privacy-focused analytics</li>
                <li><strong>Vercel</strong> - Website hosting</li>
                <li><strong>Supabase</strong> - Database services</li>
              </ul>
              <p className="font-ui leading-relaxed mt-4" style={{ color: 'var(--text-secondary)' }}>
                These services have their own privacy policies and may collect additional information.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Data Security
              </h2>
              <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We implement reasonable security measures to protect your information. However,
                no method of transmission over the Internet is 100% secure, and we cannot guarantee
                absolute security.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Your Rights
              </h2>
              <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                You have the right to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 font-ui" style={{ color: 'var(--text-secondary)' }}>
                <li>Opt out of analytics tracking</li>
                <li>Request information about data we've collected</li>
                <li>Request deletion of your data</li>
                <li>Disable cookies in your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Children's Privacy
              </h2>
              <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Our website is not directed to children under 13. We do not knowingly collect
                personal information from children under 13. If you believe we have collected
                such information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Changes to This Policy
              </h2>
              <p className="font-ui leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                We may update this Privacy Policy from time to time. Changes will be posted on
                this page with an updated "Last Updated" date.
              </p>
            </section>

            <section
              className="p-6 rounded-lg border"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--accent-primary)'
              }}
            >
              <h2 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Contact Us
              </h2>
              <p className="font-ui" style={{ color: 'var(--text-secondary)' }}>
                If you have questions about this Privacy Policy or our data practices, please
                email us at{' '}
                <a href="mailto:info@tripledmap.com" className="font-semibold hover:underline" style={{ color: 'var(--accent-primary)' }}>
                  info@tripledmap.com
                </a>
                .
              </p>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
