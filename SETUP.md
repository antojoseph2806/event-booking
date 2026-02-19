# Quick Setup Guide

## Backend Setup (Already Done!)

The backend is currently running on `http://localhost:8000`

To stop it: Press `CTRL+C` in the terminal

To start it again:
```bash
cd backend
python main.py
```

Or use the batch file:
```bash
start-backend.bat
```

## Frontend Setup

1. Open a NEW terminal (keep backend running)

2. Navigate to frontend folder:
```bash
cd frontend
```

3. Install dependencies:
```bash
npm install
```

4. Create `.env` file in frontend folder with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
```

5. Start the frontend:
```bash
npm run dev
```

Or use the batch file:
```bash
start-frontend.bat
```

The frontend will run on `http://localhost:3000`

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project

2. Once created, go to SQL Editor and run the schema from `backend/supabase_schema.sql`

3. Get your credentials from Settings > API:
   - Project URL
   - Anon/Public key
   - Service Role key (for backend .env)
   - JWT Secret (for backend .env)

4. Update both `.env` files:
   - `frontend/.env` - Add SUPABASE_URL and SUPABASE_ANON_KEY
   - `backend/.env` - Add SUPABASE_URL, SUPABASE_KEY (service role), and SUPABASE_JWT_SECRET

## Creating an Admin User

1. Register a normal user through the app
2. Go to Supabase Dashboard > Authentication > Users
3. Click on your user
4. In "Raw User Meta Data", add:
```json
{
  "role": "admin",
  "name": "Your Name"
}
```
5. Save and log in again at `/admin/login`

## Troubleshooting

### Backend Issues
- Make sure virtual environment is activated
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify `.env` file has correct Supabase credentials

### Frontend Issues
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check that `.env` file exists with correct values
- Clear browser cache if pages don't load

## Next Steps

1. Set up Supabase database
2. Configure environment variables
3. Start both servers
4. Open `http://localhost:3000` in your browser
5. Register a user and start booking events!
