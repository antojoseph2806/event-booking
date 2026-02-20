"""
Create Confirmed Test User
This script creates a test user with email already confirmed so you can log in immediately.
"""

import os
import requests
import json

def create_confirmed_user():
    # Your Supabase credentials
    SUPABASE_URL = "https://amnxuwxwmifiqhiskise.supabase.co"
    SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbnh1d3h3bWlmaXFoaXNraXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxNzc1NCwiZXhwIjoyMDg3MDkzNzU0fQ.OjVy_i0uQ4hUhQvOGjYETyZ8LUTLGs1o-NfPv3Eq384"
    
    # Test user credentials
    test_email = "confirmeduser@example.com"
    test_password = "password123"
    test_name = "Confirmed Test User"
    
    print("🔧 Creating confirmed test user...")
    print("=" * 40)
    
    # Headers for admin API
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json"
    }
    
    # User data
    user_data = {
        "email": test_email,
        "password": test_password,
        "email_confirm": True,  # This skips email confirmation
        "user_metadata": {
            "name": test_name,
            "role": "user"
        }
    }
    
    try:
        # Make the API request to create user
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers=headers,
            json=user_data
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Success! Test user created with confirmed email")
            print(f"📧 Email: {test_email}")
            print(f"🔑 Password: {test_password}")
            print(f"👤 Name: {test_name}")
            print("\n📝 You can now log in with these credentials!")
            return True
        else:
            print(f"❌ Failed to create user: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_login():
    """Test if we can log in with the created user"""
    import time
    
    # Wait a moment for user creation to propagate
    time.sleep(2)
    
    SUPABASE_URL = "https://amnxuwxwmifiqhiskise.supabase.co"
    SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbnh1d3h3bWlmaXFoaXNraXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTc3NTQsImV4cCI6MjA4NzA5Mzc1NH0.i1x5W_nK4SNTZuWvJ1nHLtZB7cbHYgSClBu6XsQS93s"
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
    }
    
    login_data = {
        "email": "confirmeduser@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers=headers,
            json=login_data
        )
        
        if response.status_code == 200:
            print("✅ Login test successful!")
            return True
        else:
            print(f"❌ Login test failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login test error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Supabase Confirmed User Creator")
    print("=" * 40)
    
    if create_confirmed_user():
        print("\n🧪 Testing login...")
        if test_login():
            print("\n🎉 All set! You can now log in with:")
            print("Email: confirmeduser@example.com")
            print("Password: password123")
        else:
            print("\n⚠️  User created but login test failed")
            print("Try logging in manually through the app")
    else:
        print("\n❌ Failed to create user")
        print("Try the dashboard method instead")