'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeaderProps {
  currentPage?: 'home' | 'map';
}

export function Header({ currentPage }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <a
        href="#main-content"
        className="skip-to-content"
      >
        Skip to main content
      </a>
      <header
        className="fixed top-0 left-0 right-0 border-b transition-shadow duration-200"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-light)',
          boxShadow: isScrolled ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
          zIndex: 9999
        }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display text-2xl font-900 tracking-tight leading-none"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Triple D Map
            </span>
          </Link>
        </div>
      </header>
      <div className="h-16"></div>
    </>
  );
}
