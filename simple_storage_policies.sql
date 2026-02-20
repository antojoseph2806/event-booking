-- Essential Supabase Storage Policies for event-images bucket
-- Run this in your Supabase SQL Editor

-- Policy 1: Allow authenticated users to upload images
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'event-images');

-- Policy 2: Allow public read access to images
create policy "Allow public read"
on storage.objects for select
to public
using (bucket_id = 'event-images');

-- Optional policies (you can add these later if needed)
-- Policy 3: Allow authenticated updates
-- create policy "Allow authenticated updates"
-- on storage.objects for update
-- to authenticated
-- using (bucket_id = 'event-images');

-- Policy 4: Allow authenticated deletes
-- create policy "Allow authenticated deletes"
-- on storage.objects for delete
-- to authenticated
-- using (bucket_id = 'event-images');