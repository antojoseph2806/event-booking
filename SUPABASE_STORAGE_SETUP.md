# Supabase Storage Setup Guide

## Step-by-Step Instructions

### 1. Access Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your project (amnxuwxwmifiqhiskise)

### 2. Create Storage Bucket
1. In the left sidebar, click on **Storage**
2. Click **New Bucket** button
3. Fill in the form:
   - **Name**: `event-images`
   - **Public**: ✅ Check this box (make it publicly accessible)
   - **File size limit**: `5242880` bytes (5MB)
   - **Allowed MIME types**: `image/*`

### 3. Set Bucket Policies
After creating the bucket, you need to set up access policies:

1. Click on your `event-images` bucket
2. Go to the **Settings** tab
3. Click **Policies** in the left sidebar
4. Add these two policies:

**Policy 1: Allow authenticated uploads**
```sql
FOR INSERT TO authenticated WITH CHECK (true)
```

**Policy 2: Allow public read access**
```sql
FOR SELECT TO public USING (true)
```

### 4. Alternative: Use SQL Editor
If the policy interface doesn't work, you can use the SQL Editor:

1. Go to **SQL Editor** in the left sidebar
2. Run this SQL query:

```sql
-- Create the bucket
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true);

-- Set up policies
create policy "Anyone can upload images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'event-images');

create policy "Anyone can read images"
on storage.objects for select
to public
using (bucket_id = 'event-images');
```

### 5. Verify Setup
1. Refresh your admin dashboard
2. Try to add a new event
3. Upload an image file
4. The image should upload successfully and display in the preview

## Troubleshooting

### If you get "Bucket not found" error:
- Make sure the bucket name is exactly `event-images` (lowercase)
- Verify the bucket is created in the correct project
- Check that you're using the correct Supabase URL

### If you get "400 Bad Request" error:
- Check that the bucket policies are set correctly
- Verify your Supabase credentials in `.env` files
- Make sure the file size is under 5MB

### If images don't display:
- Ensure the bucket is set to "Public"
- Check that the "Allow public read" policy is active
- Verify the image URLs are being generated correctly

## Testing the Setup

After completing the setup:

1. Go to your admin dashboard at `http://localhost:3000/admin`
2. Click "Add Event"
3. Try uploading an image file
4. You should see:
   - Image preview appears
   - Upload progress indicator
   - Success message when complete
   - Image URL stored in the event data

The image will be stored in Supabase Storage and accessible via public URLs for display on your event listings.