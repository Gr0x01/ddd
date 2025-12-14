-- Add closed_date field to track when restaurants closed
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS closed_date DATE;

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_restaurants_status ON restaurants(status);

-- Add index for closed restaurants with dates
CREATE INDEX IF NOT EXISTS idx_restaurants_closed_date ON restaurants(closed_date) WHERE closed_date IS NOT NULL;
