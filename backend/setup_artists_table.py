#!/usr/bin/env python3
"""
Setup script for creating the artists table in Supabase
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")  # Use service key for admin operations

if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")
    exit(1)

supabase: Client = create_client(url, key)

def setup_artists_table():
    """Create the artists table with proper schema and policies"""
    
    # Read the SQL file
    with open('create_artists_table.sql', 'r') as f:
        sql_commands = f.read()
    
    try:
        # Execute the SQL commands
        # Note: Supabase Python client doesn't directly support raw SQL execution
        # You'll need to run this SQL in the Supabase SQL Editor
        print("=" * 60)
        print("ARTISTS TABLE SETUP")
        print("=" * 60)
        print("\nPlease run the following SQL in your Supabase SQL Editor:")
        print("\n" + sql_commands)
        print("\n" + "=" * 60)
        print("\nAlternatively, you can:")
        print("1. Go to your Supabase Dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of 'create_artists_table.sql'")
        print("4. Click 'Run'")
        print("\n" + "=" * 60)
        
        # Try to verify if table exists
        try:
            result = supabase.table('artists').select("*").limit(1).execute()
            print("\n✓ Artists table already exists!")
            print(f"  Current artists count: {len(result.data)}")
        except Exception as e:
            print("\n✗ Artists table does not exist yet.")
            print("  Please create it using the SQL above.")
            
    except Exception as e:
        print(f"\nError: {str(e)}")
        return False
    
    return True

def add_sample_artists():
    """Add some sample artists for testing"""
    
    sample_artists = [
        {
            "name": "DJ Shadow",
            "role": "Electronic DJ",
            "bio": "World-renowned electronic music producer and DJ known for innovative beats and mixing.",
            "image_url": "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop"
        },
        {
            "name": "The Midnight Collective",
            "role": "Live Band",
            "bio": "Indie rock band bringing high-energy performances and original compositions.",
            "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
        },
        {
            "name": "Luna Martinez",
            "role": "Singer/Songwriter",
            "bio": "Soulful vocalist with a unique blend of R&B and contemporary pop.",
            "image_url": "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop"
        },
        {
            "name": "Bass Frequency",
            "role": "EDM Producer",
            "bio": "High-energy EDM artist specializing in bass-heavy drops and festival anthems.",
            "image_url": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"
        }
    ]
    
    try:
        print("\nAdding sample artists...")
        for artist in sample_artists:
            result = supabase.table('artists').insert(artist).execute()
            print(f"✓ Added: {artist['name']}")
        
        print("\n✓ Sample artists added successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Error adding sample artists: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n🎵 Setting up Artists Table for HyperMoth Events 🎵\n")
    
    if setup_artists_table():
        print("\n" + "=" * 60)
        response = input("\nWould you like to add sample artists? (y/n): ")
        if response.lower() == 'y':
            add_sample_artists()
    
    print("\n✓ Setup complete!\n")
