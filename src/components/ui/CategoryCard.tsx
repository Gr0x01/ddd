import Link from 'next/link';
import { ReactNode } from 'react';

interface CategoryCardProps {
  href: string;
  title: string;
  count: number;
  countLabel?: string;
  subtitle?: string;
  badge?: string;
  icon?: ReactNode;
}

export function CategoryCard({
  href,
  title,
  count,
  countLabel = 'restaurants',
  subtitle,
  badge,
  icon,
}: CategoryCardProps) {
  const ariaLabel = `${title}${subtitle ? ` - ${subtitle}` : ''}: ${count} ${countLabel}`;

  return (
    <Link
      href={href}
      className="category-card group"
      aria-label={ariaLabel}
    >
      {/* Left accent bar */}
      <div className="category-card-accent" />

      <div className="category-card-content">
        {/* Icon if provided */}
        {icon && (
          <div className="category-card-icon">
            {icon}
          </div>
        )}

        {/* Main content */}
        <div className="category-card-main">
          <div className="category-card-header">
            <h3 className="category-card-title">
              {title}
            </h3>
            {badge && (
              <span className="category-card-badge">
                {badge}
              </span>
            )}
          </div>

          {subtitle && (
            <p className="category-card-subtitle">
              {subtitle}
            </p>
          )}

          <div className="category-card-count">
            <span className="category-card-count-number">{count}</span>
            <span className="category-card-count-label">{countLabel}</span>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="category-card-arrow">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
