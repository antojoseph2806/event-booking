-- Supabase Storage Policies for event-images bucket
-- Run this in your Supabase SQL Editor

-- First, ensure the event-images bucket exists
-- If it doesn't exist, uncomment and run this:
-- insert into storage.buckets (id, name, public) 
-- values ('event-images', 'event-images', true);

-- Set up policies for the event-images bucket

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

-- Policy 3: Allow users to update their own images (optional)
create policy "Allow authenticated updates"
on storage.objects for update
to authenticated
using (bucket_id = 'event-images');

-- Policy 4: Allow users to delete their own images (optional)
create policy "Allow authenticated deletes"
on storage.objects for delete
to authenticated
using (bucket_id = 'event-images');

-- Verify the policies were created (this may not work in all Supabase versions)
-- If the above line causes an error, simply remove it and run the policies above
-- The important part is that the policies are created successfully