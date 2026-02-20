import os
from dotenv import load_dotenv
from supabase import create_client
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")  # Using service role key for admin access

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    exit(1)

supabase = create_client(supabase_url, supabase_key)

# Sample events data
sample_events = [
    {
        "title": "Tech Conference 2026",
        "description": "Join us for the biggest tech conference of the year featuring industry leaders, workshops, and networking opportunities.",
        "date": (datetime.now() + timedelta(days=15)).isoformat(),
        "location": "San Francisco Convention Center",
        "price": 299.99,
        "capacity": 500,
        "image_url": "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "title": "Music Festival",
        "description": "Three days of amazing music, food, and fun with top artists from around the world.",
        "date": (datetime.now() + timedelta(days=30)).isoformat(),
        "location": "Central Park, New York",
        "price": 149.50,
        "capacity": 1000,
        "image_url": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "title": "Business Workshop",
        "description": "Learn essential business skills and strategies from successful entrepreneurs and industry experts.",
        "date": (datetime.now() + timedelta(days=7)).isoformat(),
        "location": "Downtown Business Center",
        "price": 89.99,
        "capacity": 150,
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "title": "Art Exhibition",
        "description": "Contemporary art showcase featuring works from emerging and established artists.",
        "date": (datetime.now() + timedelta(days=22)).isoformat(),
        "location": "Modern Art Gallery",
        "price": 25.00,
        "capacity": 300,
        "image_url": "https://images.unsplash.com/photo-1578925358610-00f13c47578b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "title": "Food & Wine Festival",
        "description": "Indulge in culinary delights and premium wines from renowned chefs and vineyards.",
        "date": (datetime.now() + timedelta(days=37)).isoformat(),
        "location": "Riverside Park",
        "price": 75.00,
        "capacity": 400,
        "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "title": "Fitness Bootcamp",
        "description": "Intensive fitness training program to kickstart your health and wellness journey.",
        "date": (datetime.now() + timedelta(days=5)).isoformat(),
        "location": "Sports Complex",
        "price": 45.00,
        "capacity": 80,
        "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    }
]

def add_sample_events():
    try:
        print("Adding sample events to database...")
        
        # Insert events
        response = supabase.table("events").insert(sample_events).execute()
        
        if response.data:
            print(f"✅ Successfully added {len(response.data)} events!")
            for event in response.data:
                print(f"  - {event['title']} ({event['date']})")
        else:
            print("❌ No events were added. Check your Supabase configuration.")
            
    except Exception as e:
        print(f"❌ Error adding events: {str(e)}")
        print("Make sure your Supabase credentials are correct in the .env file")

if __name__ == "__main__":
    add_sample_events()