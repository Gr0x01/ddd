-- Create storage bucket for restaurant photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-photos',
  'restaurant-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policy for public read access
CREATE POLICY IF NOT EXISTS "Public read access for restaurant photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-photos');

-- Set up RLS policy for authenticated uploads (service role)
CREATE POLICY IF NOT EXISTS "Service role can upload restaurant photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-photos');

-- Set up RLS policy for service role updates
CREATE POLICY IF NOT EXISTS "Service role can update restaurant photos"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'restaurant-photos');

-- Set up RLS policy for service role deletes
CREATE POLICY IF NOT EXISTS "Service role can delete restaurant photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-photos');
