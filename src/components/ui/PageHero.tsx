import { ReactNode } from 'react';
import { Breadcrumbs } from '../seo/Breadcrumbs';
import { MichelinStar } from '../icons/MichelinStar';

interface Stat {
  value: number | string | null;
  label: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: ReactNode;
  stats?: Stat[];
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  children?: ReactNode;
}

export function PageHero({ title, subtitle, description, stats, breadcrumbItems, children }: PageHeroProps) {
  // Use two-column layout when children are present (e.g., road trip form)
  const hasTwoColumnLayout = !!children;

  return (
    <section className="page-hero">
      {/* Racing stripe top */}
      <div className="page-hero-stripe" />

      {/* Diagonal stripe background pattern */}
      <div className="page-hero-pattern" />

      <div className="page-hero-container">
        {breadcrumbItems && (
          <div className="page-hero-breadcrumbs">
            <Breadcrumbs
              items={breadcrumbItems}
              className="[&_a]:text-[#1A1A1D]/60 [&_a:hover]:text-[#1A1A1D] [&_span]:text-[#1A1A1D] [&_svg]:text-[#1A1A1D]/30"
            />
          </div>
        )}

        <div className={hasTwoColumnLayout ? "page-hero-two-column" : "page-hero-content"}>
          <div className="page-hero-main">
            <h1 className="page-hero-title">
              {title}
            </h1>
            {subtitle && (
              <p className="page-hero-subtitle">
                {subtitle}
              </p>
            )}
            {description && (
              <p className="page-hero-description">
                {description}
              </p>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="page-hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="page-hero-stat">
                  <div className="page-hero-stat-value">{stat.value}</div>
                  <div className="page-hero-stat-label">
                    {stat.label === 'MICHELIN' ? (
                      <>MICHELIN <MichelinStar size={10} /></>
                    ) : (
                      stat.label
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Bottom accent */}
      <div className="page-hero-bottom-accent" />
    </section>
  );
}
