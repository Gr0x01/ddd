'use client';

import React from 'react';

interface HeroSectionProps {
  stats: { restaurants: number; episodes: number; cities: number };
  onSearchFocus?: () => void;
}

export function HeroSection({ stats, onSearchFocus }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden"
             style={{ 
               background: 'linear-gradient(120deg, var(--steel-dark) 0%, var(--absolute-black) 50%, var(--concrete-dark) 100%)',
               marginTop: '80px'
             }}>
      {/* Concrete Slabs */}
      <div className="absolute -top-1/5 -right-1/10 w-3/5 h-[120%] opacity-30 z-10"
           style={{
             background: 'linear-gradient(45deg, var(--concrete-medium) 0%, var(--concrete-dark) 100%)',
             transform: 'skew(-15deg) rotate(8deg)'
           }} />
      <div className="absolute -bottom-3/10 -left-15/100 w-4/5 h-full opacity-40 z-10"
           style={{
             background: 'linear-gradient(-30deg, var(--steel-light) 0%, var(--steel-dark) 100%)',
             transform: 'skew(20deg) rotate(-12deg)'
           }} />

      <div className="relative z-20 max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Hero Text Block */}
        <div style={{ transform: 'skew(-2deg)' }}>
          <h1 className="text-display-brutal mb-6 leading-none">
            <span className="block text-concrete-light" style={{ transform: 'translateX(-20px)' }}>FIND</span>
            <span className="block text-pure-white text-[1.2em]" style={{ transform: 'translateX(40px)' }}>DDD SPOTS</span>
            <span className="block text-safety-orange text-[0.8em]" style={{ transform: 'translateX(60px)' }}>NOW</span>
          </h1>
          <p className="text-subheading-brutal max-w-md">
            EXPLORE GUY FIERI&apos;S DINERS, DRIVE-INS AND DIVES RESTAURANT MAP
          </p>
        </div>

        {/* Search Assault */}
        <div style={{ transform: 'skew(3deg)' }}>
          <div className="bg-absolute-black border-4 border-steel-light p-6 mb-8 shadow-concrete">
            <input
              type="text"
              placeholder="RESTAURANT // CITY // STATE"
              onFocus={onSearchFocus}
              className="w-full bg-steel-dark border-2 border-concrete-dark text-pure-white p-4 mb-4 text-body-brutal focus:border-safety-orange focus:outline-none focus:shadow-orange"
            />
            <button
              onClick={onSearchFocus}
              className="w-full btn-brutal btn-brutal-primary p-4 text-display-brutal text-xl"
              style={{ transform: 'skew(-2deg)' }}>
              SEARCH MAP
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="flex-1 bg-steel-dark border-l-4 border-safety-orange p-4 flex flex-col">
              <span className="text-display-brutal text-pure-white text-3xl leading-none">{stats.restaurants}</span>
              <span className="text-tiny-brutal text-concrete-light mt-1">RESTAURANTS</span>
            </div>
            <div className="flex-1 bg-steel-dark border-l-4 border-safety-orange p-4 flex flex-col">
              <span className="text-display-brutal text-pure-white text-3xl leading-none">{stats.episodes}</span>
              <span className="text-tiny-brutal text-concrete-light mt-1">EPISODES</span>
            </div>
            <div className="flex-1 bg-steel-dark border-l-4 border-safety-orange p-4 flex flex-col">
              <span className="text-display-brutal text-pure-white text-3xl leading-none">{stats.cities}</span>
              <span className="text-tiny-brutal text-concrete-light mt-1">CITIES</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}