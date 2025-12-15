'use client';

import CityAutocomplete from './CityAutocomplete';
import type { City } from '@/lib/cityMatcher';
import { MapPin, Flag, ArrowUpDown, Search } from 'lucide-react';

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
            <MapPin className="hero-form-label-icon" />
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
          <ArrowUpDown strokeWidth={2.5} />
        </button>

        {/* Destination */}
        <div className="hero-form-field">
          <label className="hero-form-label">
            <Flag className="hero-form-label-icon" />
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
          min="0"
          max="3"
          step="1"
          value={[10, 25, 50, 100].indexOf(radiusMiles)}
          onChange={(e) => onRadiusChange([10, 25, 50, 100][Number(e.target.value)])}
          className="hero-radius-slider"
          disabled={isLoading}
        />
        <div className="hero-radius-labels">
          <span>10 mi</span>
          <span>25</span>
          <span>50</span>
          <span>100 mi</span>
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
            <Search className="hero-submit-icon" />
            FIND RESTAURANTS
          </>
        )}
      </button>
    </form>
  );
}
