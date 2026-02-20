"""
Test script to verify Supabase Storage setup
This script tests if the 'event-images' bucket is properly configured
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def test_storage_setup():
    # Create Supabase client
    supabase: Client = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_KEY")
    )
    
    print("Testing Supabase Storage setup...")
    print(f"Project URL: {os.getenv('SUPABASE_URL')}")
    
    try:
        # Test 1: List buckets to see if 'event-images' exists
        print("\n1. Checking available buckets...")
        buckets_response = supabase.storage.list_buckets()
        
        if buckets_response:
            bucket_names = [bucket.name for bucket in buckets_response]
            print(f"Available buckets: {bucket_names}")
            
            if 'event-images' in bucket_names:
                print("✅ 'event-images' bucket found")
            else:
                print("❌ 'event-images' bucket NOT found")
                print("Please create the bucket following the setup guide")
                return False
        else:
            print("❌ No buckets found or error listing buckets")
            return False
            
        # Test 2: Try to upload a small test file
        print("\n2. Testing upload permissions...")
        test_content = b"test file content"
        
        upload_response = supabase.storage.from_('event-images').upload(
            'test-file.txt',
            test_content,
            file_options={"content-type": "text/plain"}
        )
        
        if upload_response:
            print("✅ Upload test successful")
            
            # Test 3: Try to get public URL
            print("\n3. Testing public URL access...")
            public_url_response = supabase.storage.from_('event-images').get_public_url('test-file.txt')
            
            if public_url_response:
                print(f"✅ Public URL generated: {public_url_response}")
                print("✅ Storage setup is working correctly!")
                
                # Clean up test file
                try:
                    supabase.storage.from_('event-images').remove(['test-file.txt'])
                    print("✅ Test file cleaned up")
                except:
                    print("⚠️  Could not clean up test file (not critical)")
                
                return True
            else:
                print("❌ Could not generate public URL")
                return False
        else:
            print("❌ Upload test failed")
            return False
            
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        print("Please check your Supabase setup and credentials")
        return False

if __name__ == "__main__":
    success = test_storage_setup()
    if success:
        print("\n🎉 All tests passed! Your image upload feature should work now.")
        print("Go to your admin dashboard and try uploading an image.")
    else:
        print("\n❌ Setup issues detected.")
        print("Please follow the SUPABASE_STORAGE_SETUP.md guide to fix the issues.")