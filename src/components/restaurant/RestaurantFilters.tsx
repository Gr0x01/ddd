'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, MapPin, Globe } from 'lucide-react';
import {
  useRestaurantFilters,
  filterRestaurants,
  type RestaurantData,
  type PriceTier,
  type SortOption
} from '@/lib/hooks/useRestaurantFilters';
import {
  type FilterCity,
  type FilterState,
  type FilterCountry,
  EMPTY_FILTER_CITIES,
  EMPTY_FILTER_STATES,
  EMPTY_FILTER_COUNTRIES,
} from '@/lib/utils';

interface RestaurantFiltersProps {
  cities?: FilterCity[];
  states?: FilterState[];
  countries?: FilterCountry[];
  restaurants: RestaurantData[];
  totalRestaurants: number;
  onFilteredRestaurantsChange: (restaurants: RestaurantData[]) => void;
  hideLocationDropdown?: boolean;
}

const CHIP = "font-mono text-sm tracking-wider font-medium px-3 py-1.5 transition-all border flex items-center gap-1.5";

export function RestaurantFilters({
  cities: citiesProp,
  states: statesProp,
  countries: countriesProp,
  restaurants,
  totalRestaurants,
  onFilteredRestaurantsChange,
  hideLocationDropdown = false
}: RestaurantFiltersProps) {
  // Use stable empty arrays when props are undefined/empty
  const cities = citiesProp && citiesProp.length > 0 ? citiesProp : EMPTY_FILTER_CITIES;
  const states = statesProp && statesProp.length > 0 ? statesProp : EMPTY_FILTER_STATES;
  const countries = countriesProp && countriesProp.length > 0 ? countriesProp : EMPTY_FILTER_COUNTRIES;

  const { filters, setFilters, clearFilters, hasActiveFilters } = useRestaurantFilters();
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantData[]>(restaurants);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Use ref to always have latest callback without causing re-renders
  const onFilteredRestaurantsChangeRef = useRef(onFilteredRestaurantsChange);
  useEffect(() => {
    onFilteredRestaurantsChangeRef.current = onFilteredRestaurantsChange;
  }, [onFilteredRestaurantsChange]);

  useEffect(() => {
    const filtered = filterRestaurants(restaurants, filters, states);
    setFilteredRestaurants(filtered);
    onFilteredRestaurantsChangeRef.current(filtered);
  }, [restaurants, filters, states]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setStateDropdownOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation - close dropdowns on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setCountryDropdownOpen(false);
        setStateDropdownOpen(false);
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const priceOptions: PriceTier[] = ['$', '$$', '$$$', '$$$$'];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'reviews', label: 'Most Reviews' },
  ];

  const selectedCountry = filters.country
    ? countries.find(c => c.country === filters.country)
    : null;

  const selectedState = filters.state
    ? states.find(s => s.name === filters.state || s.abbreviation === filters.state)
    : null;

  // Filter states based on selected country
  // Show US states for USA, Canadian provinces for Canada, hide for other countries
  const filteredStates = useMemo(() => {
    if (!filters.country) return states; // Show all states/provinces when no country selected
    if (filters.country === 'USA' || filters.country === 'Canada') return states; // Show states/provinces
    return EMPTY_FILTER_STATES; // Hide states dropdown for other countries (stable reference)
  }, [states, filters.country]);

  const filteredCities = useMemo(() => {
    if (!filters.state) return cities;
    const stateMatch = states.find(s => s.name === filters.state);
    return cities.filter(c =>
      c.state === filters.state ||
      (stateMatch && c.state === stateMatch.abbreviation)
    );
  }, [cities, states, filters.state]);

  const selectedCity = filters.city
    ? cities.find(c => c.name === filters.city)
    : null;

  const openCount = filteredRestaurants.filter(r => r.status === 'open').length;

  return (
    <>
      {/* Filter row */}
      <section className="border-b sticky top-16 z-40" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-light)' }}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <form className="relative" onSubmit={e => e.preventDefault()}>
              <input
                type="search"
                placeholder="Search..."
                value={filters.q}
                onChange={e => setFilters({ q: e.target.value })}
                className="w-44 h-8 pl-8 pr-3 font-mono text-sm border transition-colors focus:outline-none focus:border-[#B87333]"
                style={{ 
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)'
                }}
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            </form>

            {/* Country dropdown */}
            {!hideLocationDropdown && countries.length > 1 && (
              <div className="relative" ref={countryDropdownRef}>
                <button
                  onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                  onKeyDown={(e) => e.key === 'Escape' && setCountryDropdownOpen(false)}
                  aria-expanded={countryDropdownOpen}
                  aria-haspopup="listbox"
                  className={CHIP}
                  style={{
                    background: filters.country ? 'var(--accent-primary)' : 'transparent',
                    color: filters.country ? 'white' : 'var(--text-secondary)',
                    borderColor: filters.country ? 'var(--accent-primary)' : 'var(--border-light)',
                  }}
                >
                  <Globe className="w-3 h-3" />
                  {selectedCountry ? selectedCountry.country : 'All Countries'}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {countryDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-56 border shadow-lg z-50 max-h-72 overflow-y-auto"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                  >
                    <button
                      onClick={() => { setFilters({ country: null, state: null, city: null }); setCountryDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                      style={{ color: !filters.country ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                    >
                      All Countries
                      {!filters.country && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="border-t" style={{ borderColor: 'var(--border-light)' }} />
                    {countries.map(country => (
                      <button
                        key={country.country}
                        onClick={() => { setFilters({ country: country.country, state: null, city: null }); setCountryDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                        style={{
                          color: filters.country === country.country ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: filters.country === country.country ? 600 : 400,
                        }}
                      >
                        <span>{country.country}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[13px]">{country.count}</span>
                          {filters.country === country.country && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* State dropdown - only show when USA selected or no country filter */}
            {!hideLocationDropdown && filteredStates.length > 0 && (
              <div className="relative" ref={stateDropdownRef}>
                <button
                  onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                  onKeyDown={(e) => e.key === 'Escape' && setStateDropdownOpen(false)}
                  aria-expanded={stateDropdownOpen}
                  aria-haspopup="listbox"
                  className={CHIP}
                  style={{
                    background: filters.state ? 'var(--accent-primary)' : 'transparent',
                    color: filters.state ? 'white' : 'var(--text-secondary)',
                    borderColor: filters.state ? 'var(--accent-primary)' : 'var(--border-light)',
                  }}
                >
                  <MapPin className="w-3 h-3" />
                  {selectedState ? selectedState.name : 'All States'}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {stateDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 w-56 border shadow-lg z-50 max-h-72 overflow-y-auto"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                  >
                    <button
                      onClick={() => { setFilters({ state: null, city: null }); setStateDropdownOpen(false); }}
                      className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                      style={{ color: !filters.state ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                    >
                      All States
                      {!filters.state && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <div className="border-t" style={{ borderColor: 'var(--border-light)' }} />
                    {filteredStates.map(state => (
                      <button
                        key={state.abbreviation}
                        onClick={() => { setFilters({ state: state.name, city: null }); setStateDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                        style={{
                          color: filters.state === state.name ? 'var(--accent-primary)' : 'var(--text-secondary)',
                          fontWeight: filters.state === state.name ? 600 : 400,
                        }}
                      >
                        <span>{state.name}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[13px]">{state.count}</span>
                          {filters.state === state.name && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* City dropdown - shows when state is selected or when cities exist without states */}
            {!hideLocationDropdown && filteredCities.length > 0 && (filters.state || states.length === 0) && (
              <>
                <div className="relative" ref={cityDropdownRef}>
                  <button
                    onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                    onKeyDown={(e) => e.key === 'Escape' && setCityDropdownOpen(false)}
                    aria-expanded={cityDropdownOpen}
                    aria-haspopup="listbox"
                    className={CHIP}
                    style={{
                      background: filters.city ? 'var(--accent-primary)' : 'transparent',
                      color: filters.city ? 'white' : 'var(--text-secondary)',
                      borderColor: filters.city ? 'var(--accent-primary)' : 'var(--border-light)',
                    }}
                  >
                    {selectedCity ? selectedCity.name : 'All Cities'}
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {cityDropdownOpen && (
                    <div 
                      className="absolute top-full left-0 mt-1 w-56 border shadow-lg z-50 max-h-72 overflow-y-auto"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
                    >
                      <button
                        onClick={() => { setFilters({ city: null }); setCityDropdownOpen(false); }}
                        className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                        style={{ color: !filters.city ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
                      >
                        All Cities
                        {!filters.city && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="border-t" style={{ borderColor: 'var(--border-light)' }} />
                      {filteredCities.map(city => (
                        <button
                          key={city.name}
                          onClick={() => { setFilters({ city: city.name }); setCityDropdownOpen(false); }}
                          className="w-full px-3 py-2 text-left font-mono text-sm tracking-wider hover:bg-slate-50 transition-colors flex items-center justify-between"
                          style={{ 
                            color: filters.city === city.name ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontWeight: filters.city === city.name ? 600 : 400,
                          }}
                        >
                          <span>{city.name}</span>
                          <span className="flex items-center gap-1.5">
                            <span className="text-slate-400 text-[13px]">{city.count}</span>
                            {filters.city === city.name && <Check className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {!hideLocationDropdown && (countries.length > 1 || states.length > 0 || cities.length > 0) && (
              <div className="h-4 w-px bg-slate-200" />
            )}

            {/* Open only toggle */}
            <button
              onClick={() => setFilters({ openOnly: !filters.openOnly })}
              className={CHIP}
              style={{
                background: filters.openOnly ? 'var(--accent-success)' : 'transparent',
                color: filters.openOnly ? 'white' : 'var(--text-secondary)',
                borderColor: filters.openOnly ? 'var(--accent-success)' : 'var(--border-light)',
              }}
            >
              OPEN
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {/* Price tier chips */}
            {priceOptions.map(price => (
              <button
                key={price}
                onClick={() => setFilters({ price: filters.price === price ? null : price })}
                className={CHIP}
                style={{
                  background: filters.price === price ? 'var(--accent-primary)' : 'transparent',
                  color: filters.price === price ? 'white' : 'var(--text-secondary)',
                  borderColor: filters.price === price ? 'var(--accent-primary)' : 'var(--border-light)',
                  minWidth: '36px',
                  justifyContent: 'center',
                }}
              >
                {price}
              </button>
            ))}

            {hasActiveFilters && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <button
                  onClick={clearFilters}
                  className="font-mono text-sm tracking-wider font-medium text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Results count + Sort row */}
      <div 
        className="border-b py-2.5"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-light)' }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <p className="font-mono text-sm tracking-wider text-slate-500">
            {filteredRestaurants.length === totalRestaurants ? (
              <span>Showing all <strong className="text-slate-700">{totalRestaurants}</strong> restaurants</span>
            ) : (
              <span>
                <strong className="text-slate-700">{filteredRestaurants.length}</strong> of {totalRestaurants} restaurants
              </span>
            )}
            {openCount > 0 && openCount < filteredRestaurants.length && (
              <span className="ml-2 text-green-600">
                · {openCount} open
              </span>
            )}
          </p>

          <select
            value={filters.sort}
            onChange={e => setFilters({ sort: e.target.value as SortOption })}
            className="font-mono text-sm tracking-wider text-slate-500 bg-transparent cursor-pointer focus:outline-none border-none"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
