# ThoughtVault - ALTER_EGO

A secure personal notes vault with a terminal-inspired hacker aesthetic. Built as a microservices architecture with Python FastAPI backend and React frontend.

> **🚀 Quick Start with Docker:**
> ```bash
> git clone https://github.com/abhishek28597/thought_vault.git
> cd thought_vault
> docker compose up -d
> ```
> Then open http://localhost:3000

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

### Option 1: Docker Deployment (Recommended)

The easiest way to run ThoughtVault is using Docker Compose, which sets up all services automatically.

**Prerequisites:**
- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

**Quick Start:**

1. Clone and navigate to the project:
   ```bash
   git clone https://github.com/abhishek28597/thought_vault.git
   cd thought_vault
   ```

2. (Optional) Configure environment variables:
   ```bash
   cp env.example .env
   # Edit .env with your secure passwords
   ```

3. Build and start the containers:
   ```bash
   docker compose up -d
   ```

4. Access the application:
   - **Frontend:** http://localhost:3000
   - **Backend API:** http://localhost:8000

**Docker Commands:**

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services in background |
| `docker compose down` | Stop all services |
| `docker compose down -v` | Stop services and remove volumes (data) |
| `docker compose logs -f` | View live logs |
| `docker compose logs backend` | View backend logs only |
| `docker compose ps` | Check container status |
| `docker compose build` | Rebuild containers after code changes |

**Services:**

| Service | Container | Internal Port | External Port |
|---------|-----------|---------------|---------------|
| PostgreSQL | thoughtvault-db | 5432 | 5432 |
| FastAPI Backend | thoughtvault-backend | 8000 | 8000 |
| Frontend Server | thoughtvault-frontend | 5000 | 3000 |

### Option 2: Run Both Services Together (Local Development)
```bash
./run_services.sh
```

### Option 3: Run Services Separately (Local Development)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend:**
```bash
npm install
npm run dev:client
```

## Environment Variables

### Docker Deployment (via docker-compose.yml or .env file)
| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL username | `thoughtvault` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `secretpassword` |
| `POSTGRES_DB` | PostgreSQL database name | `thoughtvault` |
| `SECRET_KEY` | JWT secret key for authentication | `your-super-secret-key...` |

### Local Development
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
