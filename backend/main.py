from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
from dotenv import load_dotenv
# Import only what we need to avoid realtime module issues
from supabase import create_client
from supabase.client import Client
import jwt

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

# Supabase Client (for non-auth endpoints)
supabase_client: Client = create_client(
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
    quantity: int
    user_id: Optional[str] = None  # Optional since we get it from auth

class User(BaseModel):
    email: EmailStr
    name: str
    role: str = "user"

# Auth Dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        print(f"Received token (first 20 chars): {token[:20] if token else 'None'}...")
        
        if not token:
            raise HTTPException(status_code=401, detail="No token provided")
        
        # Use Supabase client to verify the token
        try:
            # Get user from Supabase using the token
            user_response = supabase_client.auth.get_user(token)
            
            if not user_response or not user_response.user:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            print(f"Token verified successfully for user: {user_response.user.id}")
            
            # Return a payload similar to JWT decode
            return {
                "sub": user_response.user.id,
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata or {}
            }
            
        except Exception as e:
            print(f"Supabase token verification error: {str(e)}")
            # Fallback to JWT decode
            try:
                payload = jwt.decode(
                    token,
                    os.getenv("SUPABASE_JWT_SECRET"),
                    algorithms=["HS256"],
                    audience="authenticated",
                    options={"verify_exp": True}
                )
                print(f"Token decoded successfully with JWT for user: {payload.get('sub', 'Unknown')}")
                return payload
            except jwt.ExpiredSignatureError:
                print("Token expired")
                raise HTTPException(status_code=401, detail="Token expired")
            except jwt.InvalidTokenError as e:
                print(f"Invalid token: {str(e)}")
                raise HTTPException(status_code=401, detail="Invalid token")
            except Exception as e:
                print(f"JWT decode error: {str(e)}")
                raise HTTPException(status_code=401, detail="Invalid token format")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Routes
@app.get("/")
async def root():
    return {"message": "Event Booking API", "version": "1.0.0"}

@app.get("/api/events")
async def get_events():
    try:
        response = supabase_client.table("events").select("*").execute()
        return {"events": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/{event_id}")
async def get_event(event_id: str):
    try:
        response = supabase_client.table("events").select("*").eq("id", event_id).execute()
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
        response = supabase_client.table("events").insert(event.dict()).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bookings")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("sub")
        response = supabase_client.table("bookings").select("*, events(*)").eq("user_id", user_id).execute()
        return {"bookings": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bookings", status_code=status.HTTP_201_CREATED)
async def create_booking(booking: Booking, current_user: dict = Depends(get_current_user)):
    try:
        user_id = current_user.get("sub")
        
        # Check if user already has a booking for this event
        existing_booking = supabase_client.table("bookings")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("event_id", booking.event_id)\
            .execute()
        
        if existing_booking.data and len(existing_booking.data) > 0:
            raise HTTPException(
                status_code=400, 
                detail="You have already booked this event"
            )
        
        # Create the booking
        booking_data = booking.dict()
        booking_data["user_id"] = user_id
        response = supabase_client.table("bookings").insert(booking_data).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get all bookings to find unique users
        bookings_response = supabase_client.table("bookings").select("user_id, created_at").execute()
        
        if not bookings_response.data:
            return {"users": []}
        
        # Get unique user IDs
        user_ids = list(set([b["user_id"] for b in bookings_response.data]))
        
        # For each user, get their details and booking count
        users_list = []
        for user_id in user_ids:
            try:
                # Get user from Supabase auth using service role
                user_response = supabase_client.auth.admin.get_user_by_id(user_id)
                
                # Get booking count
                bookings_count = supabase_client.table("bookings")\
                    .select("*", count="exact")\
                    .eq("user_id", user_id)\
                    .execute()
                
                # Get first booking date
                first_booking = next((b for b in bookings_response.data if b["user_id"] == user_id), None)
                
                if user_response and user_response.user:
                    users_list.append({
                        "id": user_response.user.id,
                        "email": user_response.user.email,
                        "created_at": user_response.user.created_at,
                        "booking_count": bookings_count.count or 0,
                        "user_metadata": user_response.user.user_metadata or {}
                    })
                else:
                    # Fallback if user not found in auth
                    users_list.append({
                        "id": user_id,
                        "email": f"user_{user_id[:8]}@deleted.com",
                        "created_at": first_booking["created_at"] if first_booking else None,
                        "booking_count": bookings_count.count or 0,
                        "user_metadata": {}
                    })
            except Exception as user_error:
                print(f"Error fetching user {user_id}: {str(user_error)}")
                # Add user with limited info if fetch fails
                bookings_count = supabase_client.table("bookings")\
                    .select("*", count="exact")\
                    .eq("user_id", user_id)\
                    .execute()
                first_booking = next((b for b in bookings_response.data if b["user_id"] == user_id), None)
                
                users_list.append({
                    "id": user_id,
                    "email": f"user_{user_id[:8]}@unknown.com",
                    "created_at": first_booking["created_at"] if first_booking else None,
                    "booking_count": bookings_count.count or 0,
                    "user_metadata": {}
                })
        
        return {"users": users_list}
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Delete user's bookings
        supabase_client.table("bookings").delete().eq("user_id", user_id).execute()
        
        return {"message": "User bookings deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users/{user_id}/block")
async def block_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Store blocked status in a separate table or user metadata
        # For now, we'll just return success
        return {"message": "User blocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        events_count = supabase_client.table("events").select("*", count="exact").execute()
        bookings_count = supabase_client.table("bookings").select("*", count="exact").execute()
        
        # Get unique users from bookings
        bookings_response = supabase_client.table("bookings").select("user_id").execute()
        unique_users = len(set([b["user_id"] for b in bookings_response.data]))
        
        return {
            "total_users": unique_users,
            "total_events": events_count.count,
            "total_bookings": bookings_count.count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/bookings")
async def get_all_bookings(current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get all bookings with event details
        response = supabase_client.table("bookings")\
            .select("*, events(*)")\
            .order("created_at", desc=True)\
            .execute()
        
        # Enrich with user details
        bookings_with_users = []
        for booking in response.data:
            try:
                user_response = supabase_client.auth.admin.get_user_by_id(booking["user_id"])
                booking["user"] = {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                    "user_metadata": user_response.user.user_metadata or {}
                }
            except Exception as e:
                print(f"Error fetching user {booking['user_id']}: {str(e)}")
                booking["user"] = {
                    "id": booking["user_id"],
                    "email": "unknown@user.com",
                    "user_metadata": {}
                }
            bookings_with_users.append(booking)
        
        return {"bookings": bookings_with_users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/admin/bookings/{booking_id}/confirm")
async def confirm_booking_entry(booking_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Update booking status to 'checked_in'
        response = supabase_client.table("bookings")\
            .update({"status": "checked_in"})\
            .eq("id", booking_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return {"message": "Entry confirmed successfully", "booking": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/bookings/verify-qr")
async def verify_qr_code(qr_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_metadata", {}).get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        ticket_id = qr_data.get("ticketId")
        if not ticket_id:
            raise HTTPException(status_code=400, detail="Invalid QR code data")
        
        # Get booking details
        response = supabase_client.table("bookings")\
            .select("*, events(*)")\
            .eq("id", ticket_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = response.data[0]
        
        # Get user details
        try:
            user_response = supabase_client.auth.admin.get_user_by_id(booking["user_id"])
            booking["user"] = {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata or {}
            }
        except Exception:
            booking["user"] = {
                "id": booking["user_id"],
                "email": "unknown@user.com",
                "user_metadata": {}
            }
        
        # Auto-confirm entry
        supabase_client.table("bookings")\
            .update({"status": "checked_in"})\
            .eq("id", ticket_id)\
            .execute()
        
        booking["status"] = "checked_in"
        
        return {
            "valid": True,
            "booking": booking,
            "message": "Entry confirmed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
