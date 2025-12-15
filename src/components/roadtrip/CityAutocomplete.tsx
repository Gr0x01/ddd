/**
 * City autocomplete input with fuzzy matching
 * Shows dropdown suggestions as user types
 */

'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { matchCities, formatCity, expandAbbreviation, type City } from '@/lib/cityMatcher';
import { X } from 'lucide-react';

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
    <div ref={containerRef} className="city-autocomplete-container">
      {label && (
        <label className="city-autocomplete-label">
          {label}
        </label>
      )}

      <div className="city-autocomplete-wrapper">
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
          className="city-autocomplete-input"
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
            className="city-autocomplete-clear"
            aria-label="Clear input"
          >
            <X strokeWidth={2.5} />
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
          className="city-autocomplete-dropdown"
        >
          {suggestions.map((city, index) => (
            <div
              key={`${city.city}-${city.state}`}
              id={`city-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => selectCity(city)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`city-autocomplete-option ${
                index === selectedIndex ? 'city-autocomplete-option-selected' : ''
              }`}
            >
              <span className="city-autocomplete-option-text">
                {city.city}, {city.state}
              </span>
            </div>
          ))}

          {/* Hint at bottom */}
          <div className="city-autocomplete-hint">
            ↑↓ Navigate • Enter Select • Esc Close
          </div>
        </div>
      )}

      {/* Helper text */}
      {!showSuggestions && value.trim().length > 0 && suggestions.length === 0 && (
        <p className="city-autocomplete-no-match">
          No matches. Try &quot;{value}, [STATE]&quot;
        </p>
      )}
    </div>
  );
}
