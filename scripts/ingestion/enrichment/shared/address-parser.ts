/**
 * Parse city and state from a full address string
 */

const STATE_NAME_TO_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'Washington, D.C.': 'DC', 'D.C.': 'DC'
};

export interface ParsedAddress {
  city: string | undefined;
  state: string | null | undefined;
}

/**
 * Parse city and state from a full address
 * Handles formats like:
 * - "1065 Washington Avenue, Miami Beach, Florida 33139"
 * - "123 Main St, New York, NY 10001"
 * - "456 Oak Ave, Los Angeles, California"
 */
export function parseAddress(address: string): ParsedAddress {
  if (!address) {
    return { city: undefined, state: undefined };
  }

  const parts = address.split(',').map(p => p.trim());

  if (parts.length < 3) {
    return { city: undefined, state: undefined };
  }

  // City is typically second-to-last part
  const city = parts[parts.length - 2];

  // State is in the last part, before ZIP
  const lastPart = parts[parts.length - 1];

  // Try to extract state abbreviation or full name
  const stateAbbrMatch = lastPart.match(/^([A-Z]{2})\s/);
  if (stateAbbrMatch) {
    return { city, state: stateAbbrMatch[1] };
  }

  // Check for full state name
  for (const [fullName, abbr] of Object.entries(STATE_NAME_TO_ABBR)) {
    if (lastPart.includes(fullName)) {
      return { city, state: abbr };
    }
  }

  // Fallback: return null for state if we can't parse it
  return { city, state: null };
}
