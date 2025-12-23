-- Add category field to dishes table for categorization (BBQ, Seafood, Burgers, etc.)
-- This enables filtering dishes by type and creating category landing pages

ALTER TABLE dishes
ADD COLUMN category TEXT;

-- Create index for efficient filtering by category
CREATE INDEX idx_dishes_category ON dishes(category);

-- Add comment for documentation
COMMENT ON COLUMN dishes.category IS 'Dish category: BBQ, Seafood, Burgers, Mexican, Italian, Asian, Breakfast, Comfort Food, Sandwiches, Pizza, Steaks, Southern, Cajun, Desserts, Other';
