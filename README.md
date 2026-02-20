# Event Booking Web Application

A premium, fully responsive event booking platform built with React, Tailwind CSS, FastAPI, Django, and Supabase.

## Features

- 🎨 Premium and stylish design
- 📱 Fully responsive on all devices
- ⚡ Lightning-fast performance
- 🔐 Secure authentication with Supabase Auth
- 👤 User and Admin dashboards
- 📊 Real-time analytics
- 🎫 Event booking system
- 🖼️ Image upload for events (Supabase Storage)
- 📁 Direct file upload instead of manual URLs

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- React Router
- Supabase Client
- Vite

### Backend
- Python FastAPI
- Django
- Supabase (PostgreSQL)
- JWT Authentication

## Project Structure

```
event-booking/
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── lib/           # Utilities
│   │   └── App.jsx
│   └── package.json
│
└── backend/               # Python backend
    ├── main.py           # FastAPI application
    ├── django_app/       # Django configuration
    └── requirements.txt
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Supabase account

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `backend/supabase_schema.sql`
3. Get your project URL and anon key from Settings > API

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your Supabase credentials to .env
# SUPABASE_URL=your_supabase_url
# SUPABASE_KEY=your_supabase_service_role_key
# SUPABASE_JWT_SECRET=your_jwt_secret

# Start FastAPI server
python main.py
```

Backend will run on `http://localhost:8000`

## Pages

1. **Home Page** - Landing page with features and call-to-action
2. **User Login** - Authentication for users
3. **User Registration** - New user signup
4. **User Dashboard** - User's event bookings and upcoming events
5. **Admin Login** - Secure admin authentication
6. **Admin Dashboard** - Platform analytics and management

## Key Features

### Responsive Sidebar
- Fully responsive on all devices
- Mobile-friendly hamburger menu
- Smooth transitions and animations
- Different menu items for users and admins

### Authentication
- Supabase Auth integration
- JWT token-based authentication
- Role-based access control (User/Admin)
- Secure password handling

### Performance Optimizations
- Code splitting with React Router
- Lazy loading of components
- Optimized images
- Minimal bundle size
- Fast API responses

## Setting up Image Upload

To enable image uploads for events, you need to set up Supabase Storage:

### Quick Setup:
1. Run the test script to check current setup:
```bash
cd backend
python test_storage_setup.py
```

2. If setup is incomplete, follow the detailed guide in `SUPABASE_STORAGE_SETUP.md`

### Manual Setup:
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to Storage > Buckets
4. Click "New Bucket"
5. Configure:
   - Name: `event-images`
   - Public: ✅ Yes
   - File size limit: 5242880 bytes (5MB)
   - Allowed MIME types: `image/*`
6. Set bucket policies for authenticated uploads and public read access

For detailed step-by-step instructions, see [SUPABASE_STORAGE_SETUP.md](SUPABASE_STORAGE_SETUP.md)

## Creating Admin User

To create an admin user, sign up normally and then update the user's role in Supabase:

1. Go to Supabase Dashboard > Authentication > Users
2. Find your user and click to edit
3. In Raw User Meta Data, add: `{"role": "admin", "name": "Your Name"}`
4. Save changes

## API Endpoints

### Public
- `GET /` - API info
- `GET /api/events` - List all events
- `GET /api/events/{id}` - Get event details

### Authenticated
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking

### Admin Only
- `POST /api/events` - Create event
- `GET /api/admin/stats` - Get platform statistics

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
python main.py
```

### Build for Production
```bash
cd frontend
npm run build
```

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

## License

MIT License
