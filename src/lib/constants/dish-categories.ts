/**
 * Dish category constants - single source of truth
 */

export const DISH_CATEGORIES = [
  'BBQ',
  'Seafood',
  'Burgers',
  'Mexican',
  'Italian',
  'Asian',
  'Breakfast',
  'Comfort Food',
  'Sandwiches',
  'Pizza',
  'Steaks',
  'Southern',
  'Cajun',
  'Desserts',
  'Other',
] as const;

export type DishCategory = (typeof DISH_CATEGORIES)[number];

// Slug to category name mapping
export const DISH_CATEGORY_MAP: Record<string, DishCategory> = {
  'bbq': 'BBQ',
  'seafood': 'Seafood',
  'burgers': 'Burgers',
  'mexican': 'Mexican',
  'italian': 'Italian',
  'asian': 'Asian',
  'breakfast': 'Breakfast',
  'comfort-food': 'Comfort Food',
  'sandwiches': 'Sandwiches',
  'pizza': 'Pizza',
  'steaks': 'Steaks',
  'southern': 'Southern',
  'cajun': 'Cajun',
  'desserts': 'Desserts',
  'other': 'Other',
};

// Category info for display (name + description)
export const DISH_CATEGORY_INFO: Record<string, { name: string; description: string }> = {
  'bbq': { name: 'BBQ', description: 'Smoked meats, ribs, brisket, and classic barbecue dishes featured on the show.' },
  'seafood': { name: 'Seafood', description: 'Fresh fish, shrimp, crab, lobster, and ocean-inspired dishes Guy loved.' },
  'burgers': { name: 'Burgers', description: 'Epic burgers and creative hamburger creations from across America.' },
  'mexican': { name: 'Mexican', description: 'Tacos, burritos, enchiladas, and authentic Mexican-inspired cuisine.' },
  'italian': { name: 'Italian', description: 'Pasta, pizza-adjacent dishes, and Italian-American comfort food.' },
  'asian': { name: 'Asian', description: 'Chinese, Japanese, Thai, Vietnamese, Korean, and other Asian cuisines.' },
  'breakfast': { name: 'Breakfast', description: 'Morning favorites from eggs and pancakes to breakfast burritos.' },
  'comfort-food': { name: 'Comfort Food', description: 'Mac and cheese, meatloaf, casseroles, and hearty home cooking.' },
  'sandwiches': { name: 'Sandwiches', description: 'Subs, hoagies, and creative sandwich creations.' },
  'pizza': { name: 'Pizza', description: 'Pizza pies and calzones from pizzerias across the country.' },
  'steaks': { name: 'Steaks', description: 'Beef steaks, prime rib, and premium meat dishes.' },
  'southern': { name: 'Southern', description: 'Fried chicken, soul food, and classic Southern cooking.' },
  'cajun': { name: 'Cajun', description: 'Louisiana cuisine including gumbo, jambalaya, and crawfish.' },
  'desserts': { name: 'Desserts', description: 'Sweet treats, pies, cakes, and ice cream that Guy couldn\'t resist.' },
  'other': { name: 'Other', description: 'Unique dishes that defy categorization.' },
};

// Helper to convert slug to category name
export function slugToCategory(slug: string): DishCategory | null {
  return DISH_CATEGORY_MAP[slug] || null;
}

// Helper to convert category name to slug
export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

// Validate slug format
export function isValidCategorySlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug in DISH_CATEGORY_MAP;
}
