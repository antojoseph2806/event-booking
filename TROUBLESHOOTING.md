# Troubleshooting Guide

## Image Upload Not Working

### Issue: "Bucket not found" error when uploading images

**Solution 1: Set up Supabase Storage Bucket**

1. Go to your Supabase Dashboard
2. Navigate to **Storage** > **Buckets**
3. Click **New Bucket**
4. Configure:
   - Name: `event-images`
   - Public: ✅ Yes
   - File size limit: 5242880 bytes (5MB)
5. Click **Create Bucket**

6. Set up policies by running this SQL in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'event-images');

-- Allow public read access
create policy "Anyone can read images"
on storage.objects for select
to public
using (bucket_id = 'event-images');
```

**Solution 2: Use Image URL Instead**

If you don't want to set up storage:
1. Upload your image to any image hosting service (Imgur, Cloudinary, etc.)
2. Copy the direct image URL
3. In the event form, paste the URL in the "Or paste image URL here" field
4. Skip the file upload

---

## Booking Not Working

### Issue: Bookings fail or show errors

**Check 1: Backend Server Running**

Make sure the backend server is running:

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Check 2: Frontend Environment Variables**

Make sure `frontend/.env` has the correct API URL:

```env
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Check 3: User Authentication**

1. Make sure you're logged in as a user (not admin)
2. Try logging out and logging back in
3. Check browser console for any error messages

**Check 4: Database Tables**

Make sure the `bookings` table exists in Supabase:

```sql
-- Check if bookings table exists
SELECT * FROM bookings LIMIT 1;
```

If it doesn't exist, create it:

```sql
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own bookings"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );
```

---

## Common Issues

### Issue: "CORS error" in browser console

**Solution:**

1. Make sure backend is running on port 8000
2. Check that frontend is running on port 3000
3. Restart both servers

### Issue: "Token expired" error

**Solution:**

1. Log out
2. Clear browser cache/cookies
3. Log back in

### Issue: Images not displaying

**Solution:**

1. Check if the image URL is accessible
2. Make sure the URL starts with `http://` or `https://`
3. Try using a different image URL

---

## Quick Start Checklist

- [ ] Supabase project created
- [ ] Environment variables set in `frontend/.env` and `backend/.env`
- [ ] Database tables created (events, bookings, users)
- [ ] Storage bucket `event-images` created (optional)
- [ ] Backend server running (`python backend/main.py`)
- [ ] Frontend server running (`npm run dev` in frontend folder)
- [ ] Admin user created
- [ ] Test user created

---

## Getting Help

If you're still having issues:

1. Check the browser console for error messages (F12)
2. Check the backend terminal for error logs
3. Verify all environment variables are set correctly
4. Make sure Supabase project is active and not paused
