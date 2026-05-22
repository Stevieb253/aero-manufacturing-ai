# Aero Manufacturing AI

An aerospace manufacturing assistant that analyzes STEP/STP files and helps reduce manual review time for programmers, estimators, and manufacturing engineers.

## Tech Stack

- **Backend:** Python, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend:** React, Vite
- **Geometry:** OpenCASCADE via pythonocc-core (conda-forge)

---

## Local Development Setup

### Prerequisites

- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) (Windows 64-bit)
- PostgreSQL running locally (or update `DATABASE_URL` in `.env` to use SQLite for quick testing)
- Node.js 18+

---

### Backend

**1. Create and activate the conda environment:**
```bash
conda create -n aero-ai python=3.11 -y
conda activate aero-ai
```

**2. Install pythonocc-core (must use conda-forge, not pip):**
```bash
conda install -c conda-forge pythonocc-core -y
```

**3. Install remaining backend dependencies:**
```bash
pip install -r backend/requirements.txt
```

**4. Configure environment:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and set DATABASE_URL
```

**5. Run the backend:**
```bash
cd backend
uvicorn app.main:app --reload
```

API available at: http://localhost:8000  
Swagger docs at: http://localhost:8000/docs

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: http://localhost:5173

---

### Important: always activate the conda environment before running the backend

```bash
conda activate aero-ai
cd backend
uvicorn app.main:app --reload
```

---

## Project Structure

```
backend/
  app/
    main.py          # FastAPI entry point
    config.py        # Settings from .env
    database.py      # SQLAlchemy engine and session
    models/          # Database models
    schemas/         # Pydantic schemas
    routers/         # API route handlers
    services/
      geometry.py    # STEP geometry extraction (pythonocc-core)
  uploads/           # Uploaded STEP files (gitignored)
  requirements.txt

frontend/
  src/
    api/             # Axios API client
    components/      # Reusable components
    pages/           # Dashboard and PartReport pages
  package.json

docs/
  PROJECT_OVERVIEW.md
  ROADMAP.md
  CLAUDE.md
```
