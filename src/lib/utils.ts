import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize country names to consistent format
 * Handles variations like 'US', 'United States' -> 'USA'
 */
export function normalizeCountry(country: string | null | undefined): string {
  if (!country) return '';
  const c = country.trim();
  if (c === 'US' || c === 'United States') return 'USA';
  return c;
}

// Shared types for filter components
export interface FilterCity {
  name: string;
  state: string | null;
  count: number;
}

export interface FilterState {
  name: string;
  abbreviation: string;
  count: number;
}

export interface FilterCountry {
  country: string;
  count: number;
}

// Stable empty arrays to prevent unnecessary re-renders in filter components
export const EMPTY_FILTER_CITIES: FilterCity[] = [];
export const EMPTY_FILTER_STATES: FilterState[] = [];
export const EMPTY_FILTER_COUNTRIES: FilterCountry[] = [];