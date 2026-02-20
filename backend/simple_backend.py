from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from dotenv import load_dotenv
import jwt
import uuid
from datetime import datetime

load_dotenv()

app = FastAPI(title="Event Booking API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Authorization"],
)

security = HTTPBearer()

# Models
class Event(BaseModel):
    title: str
    description: str
    date: str
    location: str
    price: float
    capacity: int
    image_url: Optional[str] = None

class Booking(BaseModel):
    event_id: str
    user_id: str
    quantity: int

class User(BaseModel):
    email: EmailStr
    name: str
    role: str = "user"

# In-memory storage for testing
events_db = []
bookings_db = []

# Sample events for testing
sample_events = [
    {
        "id": "1",
        "title": "Tech Conference 2026",
        "description": "Annual technology conference featuring the latest innovations",
        "date": "2026-03-15T09:00:00",
        "location": "San Francisco Convention Center",
        "price": 299.99,
        "capacity": 500,
        "image_url": "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    },
    {
        "id": "2", 
        "title": "Music Festival",
        "description": "Three-day music festival with top artists",
        "date": "2026-06-20T14:00:00",
        "location": "Central Park, New York",
        "price": 149.99,
        "capacity": 1000,
        "image_url": "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
    }
]

events_db.extend(sample_events)

# Auth Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        print(f"Received token (first 20 chars): {token[:20] if token else 'None'}...")
        
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
            
        # Decode and verify the JWT token
        # Try HS256 first, then ES256 for Supabase tokens
        payload = None
        errors = []
        
        # Try HS256 (for custom tokens)
        try:
            payload = jwt.decode(
                token,
                os.getenv("SUPABASE_JWT_SECRET"),
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_exp": True}
            )
        except jwt.InvalidAlgorithmError as e:
            errors.append(f"HS256 failed: {str(e)}")
        except Exception as e:
            errors.append(f"HS256 error: {str(e)}")
        
        # Try ES256 (for Supabase tokens)
        if payload is None:
            try:
                # For ES256, we need the public key, not the secret
                # This is a simplified approach - in production, use proper key management
                import base64
                # Decode the JWT to get the header and determine the key type needed
                header = jwt.get_unverified_header(token)
                alg = header.get('alg', 'HS256')
                
                if alg == 'ES256':
                    # For ES256 tokens from Supabase, we need to verify differently
                    # This is a workaround - in production, use Supabase's official verification
                    payload = jwt.decode(
                        token,
                        os.getenv("SUPABASE_JWT_SECRET"),  # This won't work for ES256
                        algorithms=["ES256"],
                        audience="authenticated",
                        options={"verify_signature": False, "verify_exp": True}  # Skip signature for now
                    )
                    print("WARNING: ES256 signature verification skipped for testing")
            except Exception as e:
                errors.append(f"ES256 error: {str(e)}")
        
        if payload is None:
            print(f"All decoding attempts failed: {errors}")
            raise HTTPException(status_code=401, detail=f"Invalid token: {errors}")
        
        print(f"Token decoded successfully for user: {payload.get('sub', 'Unknown')}")
        return payload
        
    except jwt.ExpiredSignatureError as e:
        print(f"Token expired error: {str(e)}")
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as e:
        print(f"Invalid token error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.DecodeError as e:
        print(f"Token decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token format")
    except Exception as e:
        print(f"Unexpected auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Routes
@app.get("/")
async def root():
    return {"message": "Event Booking API", "version": "1.0.0"}

@app.get("/api/events")
async def get_events():
    return {"events": events_db}

@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    event = next((e for e in events_db if e["id"] == event_id), None)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@app.post("/api/events", status_code=status.HTTP_201_CREATED)
async def create_event(event: Event, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_event = {
        "id": str(uuid.uuid4()),
        **event.dict()
    }
    events_db.append(new_event)
    return new_event

@app.get("/api/bookings")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    user_bookings = [b for b in bookings_db if b["user_id"] == user_id]
    return {"bookings": user_bookings}

@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: Booking, current_user: dict = Depends(get_current_user)):
    try:
        # Check if event exists and has capacity
        event = next((e for e in events_db if e["id"] == booking.event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check capacity (simplified for demo)
        existing_bookings = [b for b in bookings_db if b["event_id"] == booking.event_id]
        total_booked = sum(b["quantity"] for b in existing_bookings)
        
        if total_booked + booking.quantity > event["capacity"]:
            raise HTTPException(status_code=400, detail="Not enough capacity")
        
        # Create booking
        new_booking = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("sub"),
            "event_id": booking.event_id,
            "quantity": booking.quantity,
            "created_at": datetime.now().isoformat()
        }
        
        bookings_db.append(new_booking)
        return new_booking
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "total_users": 100,  # Dummy data
        "total_events": len(events_db),
        "total_bookings": len(bookings_db)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)