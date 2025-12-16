/**
 * Fuzzy city matcher for road trip planner
 * Matches user input against 1,444 major US cities
 * Handles typos, abbreviations, and partial matches
 */

export interface City {
  city: string;
  state: string;
  population: number;
}

/**
 * Scoring constants for fuzzy matching
 */
const SCORING = {
  EXACT_MATCH: 1.0,
  STARTS_WITH: 0.9,
  CONTAINS: 0.7,
  FUZZY_POSITION_WEIGHT: 0.5,
  STATE_MATCH_BOOST: 0.3,
  POPULATION_DIVISOR: 20_000_000,
  POPULATION_BOOST_WEIGHT: 0.05,
  MINIMUM_SCORE_THRESHOLD: 0.3
} as const;

/**
 * Sanitize user input to prevent XSS and clean data
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate fuzzy match score (0-1, higher is better)
 * Uses simple character-based matching with position weighting
 */
function fuzzyScore(input: string, target: string): number {
  const inputLower = input.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (inputLower === targetLower) return SCORING.EXACT_MATCH;

  // Starts with (high priority)
  if (targetLower.startsWith(inputLower)) return SCORING.STARTS_WITH;

  // Contains (medium priority)
  if (targetLower.includes(inputLower)) return SCORING.CONTAINS;

  // Character-by-character fuzzy match
  let score = 0;
  let inputIndex = 0;

  for (let i = 0; i < targetLower.length && inputIndex < inputLower.length; i++) {
    if (targetLower[i] === inputLower[inputIndex]) {
      // Earlier matches score higher
      score += (1.0 - (i / targetLower.length)) * SCORING.FUZZY_POSITION_WEIGHT;
      inputIndex++;
    }
  }

  // All characters matched?
  if (inputIndex === inputLower.length) {
    return score / inputLower.length;
  }

  return 0;
}

/**
 * Parse user input into city and optional state
 * Handles formats like:
 * - "San Francisco" → { city: "San Francisco", state: null }
 * - "San Francisco, CA" → { city: "San Francisco", state: "CA" }
 * - "SF, CA" → { city: "SF", state: "CA" }
 */
function parseInput(input: string): { city: string; state: string | null } {
  const sanitized = sanitizeInput(input);

  if (sanitized.includes(',')) {
    const [city, state] = sanitized.split(',').map(s => sanitizeInput(s));
    return { city, state: state?.toUpperCase() || null };
  }

  return { city: sanitized, state: null };
}

/**
 * Match cities against user input with fuzzy matching
 * Returns top N matches sorted by relevance
 */
export function matchCities(
  input: string,
  cities: City[],
  maxResults = 10
): Array<City & { score: number }> {
  if (!input.trim()) return [];

  const { city: searchCity, state: searchState } = parseInput(input);

  // Score each city
  const scored = cities.map(city => {
    let score = fuzzyScore(searchCity, city.city);

    // Boost if state matches
    if (searchState && city.state === searchState) {
      score += SCORING.STATE_MATCH_BOOST;
    }

    // Slight boost for more populous cities (helps with ambiguous matches)
    const populationBoost = city.population > 0
      ? (city.population / SCORING.POPULATION_DIVISOR) * SCORING.POPULATION_BOOST_WEIGHT
      : 0;
    score += populationBoost;

    return { ...city, score };
  });

  // Filter to meaningful scores and sort
  return scored
    .filter(c => c.score > SCORING.MINIMUM_SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Format city for display
 */
export function formatCity(city: City): string {
  return `${city.city}, ${city.state}`;
}

/**
 * Common abbreviations and their full names
 * Helps with inputs like "NYC" → "New York City"
 */
const cityAbbreviations: Record<string, string> = {
  // Major US metros
  'NYC': 'New York, NY',
  'LA': 'Los Angeles, CA',
  'SF': 'San Francisco, CA',
  'SD': 'San Diego, CA',
  'DC': 'Washington, DC',
  'CHI': 'Chicago, IL',
  'BOS': 'Boston, MA',
  'ATL': 'Atlanta, GA',
  'MIA': 'Miami, FL',
  'SEA': 'Seattle, WA',
  'PHX': 'Phoenix, AZ',
  'DEN': 'Denver, CO',
  'PDX': 'Portland, OR',
  'LV': 'Las Vegas, NV',
  'VEGAS': 'Las Vegas, NV',
  'NOLA': 'New Orleans, LA',
  'PHILLY': 'Philadelphia, PA',

  // Texas cities
  'DFW': 'Dallas, TX',
  'HOU': 'Houston, TX',
  'SA': 'San Antonio, TX',
  'ATX': 'Austin, TX',

  // Canadian cities (airport codes)
  'YYZ': 'Toronto, ON',
  'YVR': 'Vancouver, BC',
  'YUL': 'Montreal, QC',
  'YYC': 'Calgary, AB',
  'YEG': 'Edmonton, AB',
  'YOW': 'Ottawa, ON',
  'YWG': 'Winnipeg, MB',
  'YHZ': 'Halifax, NS',
  'YQB': 'Quebec City, QC',
};

/**
 * Expand common city abbreviations
 */
export function expandAbbreviation(input: string): string | null {
  const sanitized = sanitizeInput(input);
  const upper = sanitized.toUpperCase();
  return cityAbbreviations[upper] || null;
}
