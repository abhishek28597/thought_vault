# ThoughtVault - ALTER_EGO

## Overview

ThoughtVault is a secure personal notes vault application with a terminal-inspired hacker aesthetic. It's designed as a microservices architecture with a Python FastAPI backend and a React frontend. Users can create, store, and organize their thoughts/notes with user isolation and JWT-based authentication.

## User Preferences

- Preferred communication style: Simple, everyday language
- App name: ALTER_EGO (displayed on dashboard)
- Design aesthetic: Dark hacker/terminal theme with green glowing text

## System Architecture

### Backend Architecture (Python FastAPI)
- **Location**: `/backend`
- **Port**: 8000
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens (30-day expiry)
- **Password Security**: bcrypt hashing via passlib
- **CORS**: Enabled for cross-origin requests

#### Backend Models
- **User**: UUID primary key, username (unique), hashed_password, created_at
- **Note**: UUID primary key, content, timestamp (indexed), user_id (foreign key)

#### API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/notes` - Get all user notes
- `POST /api/notes` - Create new note
- `GET /api/notes/:id` - Get specific note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Frontend Architecture
- **Location**: `/client`
- **Port**: 5000
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite with custom plugins
- **Styling**: Tailwind CSS v4 with terminal/hacker theme
- **UI Components**: shadcn/ui with Radix primitives
- **State Management**: 
  - React Query for server state and API calls
  - React Context for authentication state
- **Routing**: wouter (lightweight router)
- **Animations**: Framer Motion

### Key Design Patterns
- **Microservices**: Separate backend (Python) and frontend (React) services
- **Protected Routes**: Auth-gated components redirect to signin
- **Context Providers**: AuthProvider wraps the app for global auth state
- **API Abstraction**: Centralized API calls in `/client/src/lib/api.ts`
- **Component Structure**: Layout components, UI primitives, and page components

### Pages
- **SignIn** (`/signin`): Terminal-style authentication page
- **SignUp** (`/signup`): Account creation page  
- **Dashboard** (`/`): Main note input and recent notes stream
- **Vault** (`/vault`): Hierarchical archive (Year → Month → Day → Notes)

### UI Theme
- **Primary Color**: Terminal Green (#00ff00 / hsl(140, 100%, 50%))
- **Background**: Very dark green-black (hsl(140, 30%, 2%))
- **Typography**: JetBrains Mono (primary), Share Tech Mono (display)
- **Effects**: CRT scanlines, text glow, border glow, selection highlights
- **Design Language**: Boxy, minimal, no rounded corners, monospace everything

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable

### Backend Dependencies (Python)
- **fastapi**: Web framework
- **uvicorn**: ASGI server
- **sqlalchemy**: ORM
- **psycopg2-binary**: PostgreSQL adapter
- **python-jose**: JWT encoding/decoding
- **passlib/bcrypt**: Password hashing
- **pydantic**: Data validation
- **python-multipart**: Form data parsing

### Frontend Dependencies
- **React 19**: UI framework
- **wouter**: Routing
- **@tanstack/react-query**: Server state management
- **framer-motion**: Animations
- **date-fns**: Date formatting
- **lucide-react**: Icon library

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured)
- `SECRET_KEY`: JWT secret key for token signing
- `VITE_API_URL`: Backend API URL (defaults to http://localhost:8000)

## Running the Application

### Development Mode
Both services need to run simultaneously:

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
npm run dev:client
```

**Or use the combined script:**
```bash
./run_services.sh
```

## Recent Changes (December 10, 2025)

- Converted from mockup to full-stack application
- Changed main app title from "GHOST_PROTOCOL" to "ALTER_EGO"
- Implemented Python FastAPI backend with PostgreSQL
- Added JWT authentication system
- Created signup and signin pages with terminal aesthetic
- Integrated frontend with backend API
- Separated services into microservices architecture
- Fixed routing to use wouter Link components correctly
