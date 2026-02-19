#!/usr/bin/env python3
"""
Quick script to create an admin user in Supabase
Usage: python create_admin_user.py
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

def create_admin():
    # Get credentials from .env
    supabase_url = os.getenv("SUPABASE_URL")
    # Try service role key first, fallback to regular key
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        print("\n📝 To get your service role key:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Select your project")
        print("3. Go to Settings → API")
        print("4. Copy the 'service_role' key (NOT the anon key)")
        print("5. Add to backend/.env: SUPABASE_SERVICE_ROLE_KEY=your_key_here")
        return
    
    # Check if using service role key
    if 'service_role' not in supabase_key and 'anon' in supabase_key:
        print("⚠️  Warning: You're using the anon key, not service_role key")
        print("❌ Admin creation requires service_role key")
        print("\n📝 To fix:")
        print("1. Go to https://supabase.com/dashboard")
        print("2. Settings → API → Copy 'service_role' key")
        print("3. Add to backend/.env: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
        print("\n💡 Or use the easier method:")
        print("1. Register at http://localhost:3000/register")
        print("2. Go to Supabase Dashboard → Authentication → Users")
        print("3. Edit your user's 'Raw User Meta Data' to: {\"name\": \"Your Name\", \"role\": \"admin\"}")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    # Get admin details
    print("🔐 Create Admin User")
    print("-" * 50)
    email = input("Enter admin email: ").strip()
    password = input("Enter admin password (min 6 chars): ").strip()
    name = input("Enter admin name: ").strip()
    
    if len(password) < 6:
        print("❌ Password must be at least 6 characters")
        return
    
    try:
        # Create user with admin role using service role
        print("\n⏳ Creating admin user...")
        
        # Use the admin API
        response = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "name": name,
                "role": "admin"
            }
        })
        
        print(f"\n✅ Admin user created successfully!")
        print(f"📧 Email: {email}")
        print(f"👤 Name: {name}")
        print(f"🔑 Role: admin")
        print(f"\n🌐 Login at: http://localhost:3000/admin/login")
        
    except Exception as e:
        error_msg = str(e)
        print(f"\n❌ Error creating admin: {error_msg}")
        
        if "User not allowed" in error_msg or "not authorized" in error_msg.lower():
            print("\n🔧 This error means you need the SERVICE ROLE key, not the anon key")
            print("\n📝 Quick fix - Use the web interface instead:")
            print("1. Register at http://localhost:3000/register with this email")
            print("2. Go to https://supabase.com/dashboard")
            print("3. Authentication → Users → Click your user")
            print("4. Edit 'Raw User Meta Data' to:")
            print('   {"name": "' + name + '", "role": "admin"}')
            print("5. Save and login at /admin/login")
        else:
            print("\nNote: If user already exists, use the web interface method above")

if __name__ == "__main__":
    create_admin()
