from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import jwt

load_dotenv()

app = FastAPI(title="Event Booking API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
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

# Auth Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            os.getenv("SUPABASE_JWT_SECRET"),
            algorithms=["HS256"],
            audience="authenticated"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/")
async def root():
    return {"message": "Event Booking API", "version": "1.0.0"}

@app.get("/api/events")
async def get_events():
    try:
        response = supabase.table("events").select("*").execute()
        return {"events": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    try:
        response = supabase.table("events").select("*").eq("id", event_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Event not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events", status_code=status.HTTP_201_CREATED)
async def create_event(event: Event, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        response = supabase.table("events").insert(event.dict()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bookings")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("sub")
        response = supabase.table("bookings").select("*, events(*)").eq("user_id", user_id).execute()
        return {"bookings": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: Booking, current_user: dict = Depends(get_current_user)):
    try:
        booking_data = booking.dict()
        booking_data["user_id"] = current_user.get("sub")
        response = supabase.table("bookings").insert(booking_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        users_count = supabase.table("profiles").select("*", count="exact").execute()
        events_count = supabase.table("events").select("*", count="exact").execute()
        bookings_count = supabase.table("bookings").select("*", count="exact").execute()
        
        return {
            "total_users": users_count.count,
            "total_events": events_count.count,
            "total_bookings": bookings_count.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
