'use client';

import CityAutocomplete from './CityAutocomplete';
import type { City } from '@/lib/cityMatcher';

interface SearchFormProps {
  origin: string;
  destination: string;
  radiusMiles: number;
  isLoading: boolean;
  cities: City[];
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onRadiusChange: (value: number) => void;
  onSubmit: () => void;
}

export default function SearchForm({
  origin,
  destination,
  radiusMiles,
  isLoading,
  cities,
  onOriginChange,
  onDestinationChange,
  onRadiusChange,
  onSubmit
}: SearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const swapLocations = () => {
    const temp = origin;
    onOriginChange(destination);
    onDestinationChange(temp);
  };

  return (
    <form onSubmit={handleSubmit} className="hero-search-form">
      <div className="hero-form-accent" />

      {/* Origin & Destination Row */}
      <div className="hero-form-row hero-form-row-locations">
        {/* Origin */}
        <div className="hero-form-field">
          <label className="hero-form-label">
            <svg className="hero-form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            START
          </label>
          <CityAutocomplete
            value={origin}
            onChange={onOriginChange}
            placeholder="San Francisco, CA"
            disabled={isLoading}
            cities={cities}
          />
        </div>

        {/* Swap Button */}
        <button
          type="button"
          onClick={swapLocations}
          disabled={!origin || !destination}
          className="hero-swap-button"
          title="Swap locations"
          aria-label="Swap origin and destination"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 16V4M7 4L3 8M7 4L11 8" />
            <path d="M17 8V20M17 20L21 16M17 20L13 16" />
          </svg>
        </button>

        {/* Destination */}
        <div className="hero-form-field">
          <label className="hero-form-label">
            <svg className="hero-form-label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
              <line x1="4" y1="22" x2="4" y2="15"/>
            </svg>
            END
          </label>
          <CityAutocomplete
            value={destination}
            onChange={onDestinationChange}
            placeholder="Los Angeles, CA"
            disabled={isLoading}
            cities={cities}
          />
        </div>
      </div>

      {/* Radius Slider */}
      <div className="hero-form-radius">
        <div className="hero-radius-header">
          <label htmlFor="radius" className="hero-form-label-small">
            SEARCH RADIUS
          </label>
          <span className="hero-radius-value">{radiusMiles} MILES</span>
        </div>
        <input
          type="range"
          id="radius"
          min="5"
          max="25"
          step="5"
          value={radiusMiles}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="hero-radius-slider"
          disabled={isLoading}
        />
        <div className="hero-radius-labels">
          <span>5 mi</span>
          <span>10</span>
          <span>15</span>
          <span>20</span>
          <span>25 mi</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !origin || !destination}
        className="hero-submit-button"
      >
        {isLoading ? (
          <>
            <span className="hero-submit-spinner" />
            PLANNING ROUTE...
          </>
        ) : (
          <>
            <svg className="hero-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z"/>
              <circle cx="7.5" cy="17.5" r="1.5"/>
              <circle cx="16.5" cy="17.5" r="1.5"/>
            </svg>
            FIND RESTAURANTS
          </>
        )}
      </button>
    </form>
  );
}
