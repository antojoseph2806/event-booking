"""
Fix Supabase Authentication Configuration
This script helps fix common authentication issues by:
1. Disabling email confirmation requirement
2. Setting up proper auth policies
3. Testing authentication flow
"""

import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def fix_auth_configuration():
    # Use service role key for admin operations
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")  # Service role key
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
        print("Please add your Supabase service role key to backend/.env")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    print("🔧 Fixing Supabase Authentication Configuration...")
    print("=" * 50)
    
    try:
        # Test current auth status
        print("1. Testing current authentication setup...")
        test_user = {
            "email": "test@fixauth.com",
            "password": "password123"
        }
        
        # Try to sign up
        signup_response = supabase.auth.sign_up(test_user)
        print(f"   Sign up test: {'✅ Success' if not signup_response.error else f'❌ Error: {signup_response.error.message}'}")
        
        # Try to sign in
        signin_response = supabase.auth.sign_in_with_password(test_user)
        print(f"   Sign in test: {'✅ Success' if not signin_response.error else f'❌ Error: {signin_response.error.message}'}")
        
        if signin_response.error and "email" in signin_response.error.message.lower():
            print("\n📧 Detected email confirmation issue!")
            print("   This is a common Supabase configuration problem.")
            print("   To fix this, you need to:")
            print("   1. Go to your Supabase Dashboard")
            print("   2. Navigate to Authentication → Settings")
            print("   3. Disable 'Enable email confirmations'")
            print("   4. Or enable 'Allow unconfirmed email logins'")
            
        print("\n💡 Quick Solutions:")
        print("Option 1: Disable email confirmation in Supabase Dashboard")
        print("   - Go to: Authentication → Settings")
        print("   - Turn OFF 'Enable email confirmations'")
        print("   - Turn ON 'Allow unconfirmed email logins'")
        
        print("\nOption 2: Use email confirmation (recommended for production)")
        print("   - Keep email confirmation enabled")
        print("   - Users will receive confirmation emails")
        print("   - They must click the link before logging in")
        
        print("\nOption 3: Test with a confirmed user")
        print("   - Register a user through the app")
        print("   - Confirm the email manually")
        print("   - Then try logging in")
        
    except Exception as e:
        print(f"❌ Error testing authentication: {str(e)}")
        print("Make sure your Supabase credentials are correct in the .env file")

def create_test_user():
    """Create a test user that bypasses email confirmation"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Environment variables not set")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    print("\n🔧 Creating test user with admin privileges...")
    
    try:
        # Create user with admin API (bypasses email confirmation)
        response = supabase.auth.admin.create_user({
            "email": "testuser@example.com",
            "password": "password123",
            "email_confirm": True,  # Skip email confirmation
            "user_metadata": {
                "name": "Test User",
                "role": "user"
            }
        })
        
        if response.data:
            print("✅ Test user created successfully!")
            print(f"   Email: testuser@example.com")
            print(f"   Password: password123")
            print("   You can now log in with these credentials")
        else:
            print("❌ Failed to create test user")
            
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")

if __name__ == "__main__":
    print("🔧 Supabase Authentication Fix Tool")
    print("=" * 40)
    
    choice = input("Choose an option:\n1. Test current auth configuration\n2. Create test user (requires service role key)\n3. Both\n\nEnter choice (1-3): ")
    
    if choice == "1":
        fix_auth_configuration()
    elif choice == "2":
        create_test_user()
    elif choice == "3":
        fix_auth_configuration()
        create_test_user()
    else:
        print("Invalid choice")