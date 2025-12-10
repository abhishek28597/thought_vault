# ThoughtVault - ALTER_EGO

A secure personal notes vault with a terminal-inspired hacker aesthetic. Built as a microservices architecture with Python FastAPI backend and React frontend.

## Architecture

### Backend (Python FastAPI)
- **Location**: `/backend`
- **Port**: 8000
- **Database**: PostgreSQL
- **Features**:
  - JWT authentication
  - User signup/signin
  - Notes CRUD with user isolation
  - AES-256 password hashing

### Frontend (React + Vite)
- **Location**: `/client`
- **Port**: 5000
- **Stack**: React 19, TypeScript, Tailwind CSS v4
- **Features**:
  - Terminal/hacker UI theme
  - Authentication pages
  - Dashboard with note input
  - Archive vault with year/month/day hierarchy

## Running the Application

### Option 1: Run Both Services Together
```bash
./run_services.sh
```

### Option 2: Run Services Separately

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
npm run dev:client
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `VITE_API_URL`: Backend API URL (default: http://localhost:8000)

## Database Schema

### Users
- id (UUID, primary key)
- username (string, unique)
- hashed_password (string)
- created_at (datetime)

### Notes
- id (UUID, primary key)
- content (text)
- timestamp (datetime)
- user_id (UUID, foreign key)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Login
- `GET /api/auth/me` - Get current user

### Notes
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

## Design Philosophy

The UI follows a "Dark Hacker" aesthetic with:
- Terminal green (#00ff00) primary color
- Monospace fonts (JetBrains Mono, Share Tech Mono)
- CRT scanline effects
- Glowing text and borders
- Boxy, minimal design
- Matrix-inspired animations
