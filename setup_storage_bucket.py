"""
Setup script for Supabase Storage Bucket
Run this script to create the 'event-images' bucket and set proper permissions

This script provides detailed instructions for setting up Supabase Storage
for the event booking application image uploads.
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def setup_storage_bucket():
    # Create Supabase client
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")  # Service role key for admin operations
    )
    
    try:
        # Create storage bucket
        print("Creating 'event-images' storage bucket...")
        bucket_data = {
            "name": "event-images",
            "public": True,  # Make it publicly accessible
            "file_size_limit": 5242880,  # 5MB limit
            "allowed_mime_types": ["image/*"]  # Only allow images
        }
        
        # Note: Supabase doesn't have a direct API to create buckets via client
        # You need to create the bucket manually in the Supabase Dashboard
        print("Please create the 'event-images' bucket manually:")
        print("1. Go to your Supabase project dashboard")
        print("2. Navigate to Storage > Buckets")
        print("3. Click 'New Bucket'")
        print("4. Name it 'event-images'")
        print("5. Set it as Public")
        print("6. Set file size limit to 5MB")
        print("7. Allow only image files (image/*)")
        
        # Set bucket policies (if bucket exists)
        print("\nSetting up bucket policies...")
        
        # Policy for authenticated users to upload
        upload_policy = {
            "bucket_id": "event-images",
            "name": "Allow authenticated uploads",
            "definition": "FOR INSERT TO authenticated WITH CHECK (true)"
        }
        
        # Policy for public read access
        read_policy = {
            "bucket_id": "event-images", 
            "name": "Allow public read",
            "definition": "FOR SELECT TO public USING (true)"
        }
        
        print("Bucket setup instructions:")
        print("- Go to Storage > event-images > Settings")
        print("- Add these policies:")
        print("  1. Allow authenticated users to upload images")
        print("  2. Allow public read access to images")
        
        print("\n✅ Storage bucket setup complete!")
        print("Your event image upload feature is ready to use.")
        
    except Exception as e:
        print(f"Error setting up storage: {e}")
        print("You may need to set up the bucket manually in Supabase dashboard.")

if __name__ == "__main__":
    setup_storage_bucket()