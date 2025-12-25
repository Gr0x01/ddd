/**
 * US Region Definitions for Regional Landing Pages
 * Maps regions to their constituent states for SEO hub pages
 */

export interface Region {
  slug: string;
  name: string;
  title: string;
  description: string;
  states: string[]; // State abbreviations
}

export const REGIONS: Region[] = [
  {
    slug: 'west-coast',
    name: 'West Coast',
    title: 'West Coast Diners',
    description: 'Explore Diners, Drive-ins and Dives restaurants along the Pacific Coast, from Seattle to San Diego. California, Oregon, and Washington feature some of the most iconic Triple D spots.',
    states: ['CA', 'OR', 'WA'],
  },
  {
    slug: 'east-coast',
    name: 'East Coast',
    title: 'East Coast Diners',
    description: 'Discover Guy Fieri\'s favorite restaurants along the Atlantic seaboard. From New England classics to Florida favorites, the East Coast is packed with legendary diners.',
    states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'NC', 'SC', 'GA', 'FL'],
  },
  {
    slug: 'midwest',
    name: 'Midwest',
    title: 'Midwest Diners',
    description: 'The heartland of America serves up some of the best comfort food on Triple D. From Chicago deep dish to Kansas City BBQ, the Midwest delivers big flavors.',
    states: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'],
  },
  {
    slug: 'south',
    name: 'South',
    title: 'Southern Diners',
    description: 'Experience the legendary hospitality and bold flavors of the South. BBQ, soul food, Cajun cuisine, and Tex-Mex - the South has it all on Diners, Drive-ins and Dives.',
    states: ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY', 'WV'],
  },
  {
    slug: 'southwest',
    name: 'Southwest',
    title: 'Southwest Diners',
    description: 'From desert heat to mountain cool, the Southwest brings unique flavors to Triple D. Mexican-inspired dishes, green chile, and cowboy cuisine await.',
    states: ['AZ', 'NM', 'NV', 'UT', 'CO'],
  },
];

// Map slug to region for easy lookup
export const REGION_BY_SLUG = new Map<string, Region>(
  REGIONS.map((region) => [region.slug, region])
);

// Map state abbreviation to region(s)
export const REGION_BY_STATE = new Map<string, Region>();
REGIONS.forEach((region) => {
  region.states.forEach((state) => {
    REGION_BY_STATE.set(state, region);
  });
});

// Get all region slugs (for static params)
export function getRegionSlugs(): string[] {
  return REGIONS.map((r) => r.slug);
}

// Get region by slug
export function getRegionBySlug(slug: string): Region | undefined {
  return REGION_BY_SLUG.get(slug);
}
