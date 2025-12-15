/**
 * City autocomplete input with fuzzy matching
 * Shows dropdown suggestions as user types
 */

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { matchCities, formatCity, expandAbbreviation, type City } from '@/lib/cityMatcher';

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  cities: City[];
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Enter city and state',
  disabled = false,
  label,
  cities
}: CityAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle abbreviation expansion in onChange
  const handleInputChange = useCallback((newValue: string) => {
    const expanded = expandAbbreviation(newValue);
    if (expanded && expanded !== newValue) {
      onChange(expanded);
    } else {
      onChange(newValue);
    }
  }, [onChange]);

  // Memoize fuzzy matching for performance (pure, no side effects)
  const matches = useMemo(() => {
    if (value.trim().length > 0) {
      // Skip abbreviations since they're expanded immediately
      return matchCities(value, cities, 8);
    }
    return [];
  }, [value, cities]);

  // Derive state from matches and focus (no setState needed)
  const suggestions = matches;
  const showSuggestions = isFocused && suggestions.length > 0;

  // No longer need click outside handler - using blur instead

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectCity(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  const selectCity = useCallback((city: City) => {
    onChange(formatCity(city));
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion to register
    setTimeout(() => {
      setIsFocused(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="city-suggestions-list"
          aria-activedescendant={selectedIndex >= 0 ? `city-option-${selectedIndex}` : undefined}
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear input"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {showSuggestions && suggestions.length > 0 &&
          `${suggestions.length} suggestion${suggestions.length === 1 ? '' : 's'} available`
        }
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="city-suggestions-list"
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <div
              key={`${city.city}-${city.state}`}
              id={`city-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => selectCity(city)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-2 cursor-pointer text-left hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <span className="font-medium text-gray-900">
                {city.city}, {city.state}
              </span>
            </div>
          ))}

          {/* Hint at bottom */}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
            Use ↑↓ to navigate, Enter to select, Esc to close
          </div>
        </div>
      )}

      {/* Helper text */}
      {!showSuggestions && value.trim().length > 0 && suggestions.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">
          No matches found. Try &quot;{value}, [STATE]&quot; (e.g. &quot;Springfield, IL&quot;)
        </p>
      )}
    </div>
  );
}
