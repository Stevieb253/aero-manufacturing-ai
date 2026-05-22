# Phase 1 Engineering Progress — Aero Manufacturing AI

**Last updated:** 2026-05-22  
**Branch:** `aero-dev/phase_1`  
**Status:** Phase 1 MVP complete and functional

---

## Table of Contents

1. [Project Purpose and Vision](#1-project-purpose-and-vision)
2. [Phase 1 Goals](#2-phase-1-goals)
3. [Completed Features](#3-completed-features)
4. [Backend Architecture](#4-backend-architecture)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Database Structure](#6-database-structure)
7. [File Upload Workflow](#7-file-upload-workflow)
8. [Geometry Extraction Workflow](#8-geometry-extraction-workflow)
9. [Environment Setup](#9-environment-setup)
10. [Runtime Commands](#10-runtime-commands)
11. [Git Workflow and Branch Strategy](#11-git-workflow-and-branch-strategy)
12. [Key Engineering Decisions](#12-key-engineering-decisions)
13. [Known Limitations and Technical Debt](#13-known-limitations-and-technical-debt)
14. [Remaining Phase 1 Tasks](#14-remaining-phase-1-tasks)
15. [Planned Future Phases](#15-planned-future-phases)
16. [Notes for Future Contributors](#16-notes-for-future-contributors)

---

## 1. Project Purpose and Vision

**Aero Manufacturing AI** is a manufacturing analysis platform designed to help aerospace machine shops reduce the manual review time required when quoting and programming new parts.

The long-term goal is a system that:
- Accepts CAD files (STEP/STP format) from programmers and estimators
- Extracts real geometry data (bounding box, volume, surface area, features)
- Identifies potential manufacturability issues automatically
- Estimates machining cost and setup complexity
- Maintains a searchable database of past similar jobs
- Eventually integrates with CAM workflows (e.g. Mastercam)

This is intended to scale across multiple manufacturing businesses. Correctness, maintainability, and data integrity are the top priorities — approximations and shortcuts are explicitly avoided.

---

## 2. Phase 1 Goals

Phase 1 is the foundation MVP. The goal was to prove out the full stack with real data flow before building more sophisticated analysis on top.

| Goal | Status |
|---|---|
| STEP/STP file upload system | Complete |
| Local file storage for uploaded parts | Complete |
| FastAPI backend scaffolding | Complete |
| React frontend scaffolding | Complete |
| PostgreSQL database setup | Complete |
| Basic geometry extraction (real values via OCC) | Complete |
| Dashboard for uploaded parts | Complete |
| Individual report page per uploaded part | Complete |

---

## 3. Completed Features

### Backend
- FastAPI app with CORS configured for local Vite dev server
- `POST /parts/upload` — validates file extension, saves with UUID prefix, extracts geometry, stores in DB
- `GET /parts/` — returns all parts ordered by upload time descending
- `GET /parts/{id}` — returns a single part or 404
- `GET /health` — simple health check endpoint
- Geometry extraction using pythonocc-core (OpenCASCADE): bounding box, volume, surface area
- Graceful fallback to `null` values when geometry extraction fails
- Auto table creation on startup via `Base.metadata.create_all`

### Frontend
- Vite + React 18 single-page app
- React Router v6 with two routes: Dashboard (`/`) and Part Report (`/parts/:id`)
- Upload form with `.step`/`.stp` file filter and inline upload status
- Dashboard displays all uploaded parts as a responsive card grid
- Part report page shows full file metadata and geometry values
- Geometry values show "Pending analysis" when `null`, real values when populated
- Thin Axios API client layer (`src/api/client.js`) — no raw Axios in components

### Confirmed working end-to-end
- Upload a `.step` file from the browser
- File saved to `backend/uploads/` with UUID prefix
- Part record created in PostgreSQL with extracted geometry
- Dashboard shows new card immediately after upload
- Report page shows real bounding box, volume, and surface area values

---

## 4. Backend Architecture

```
backend/
├── app/
│   ├── main.py           # FastAPI app, CORS middleware, router registration,
│   │                     # table creation on startup
│   ├── config.py         # Pydantic Settings — reads DATABASE_URL and UPLOAD_DIR
│   │                     # from .env file
│   ├── database.py       # SQLAlchemy engine, SessionLocal, Base, get_db dependency
│   ├── models/
│   │   └── part.py       # Part ORM model (maps to 'parts' table)
│   ├── schemas/
│   │   └── part.py       # PartRead Pydantic schema (API response shape)
│   ├── routers/
│   │   └── parts.py      # Upload, list, get endpoints
│   └── services/
│       └── geometry.py   # OpenCASCADE geometry extraction
├── uploads/              # Uploaded STEP files (gitignored, tracked via .gitkeep)
├── requirements.txt      # pip-installable dependencies (pythonocc-core excluded)
└── .env.example          # Template for local .env
```

### Key dependencies

| Package | Purpose |
|---|---|
| `fastapi` | Web framework and OpenAPI generation |
| `uvicorn` | ASGI server |
| `sqlalchemy` | ORM and database session management |
| `psycopg2-binary` | PostgreSQL driver |
| `pydantic-settings` | `.env`-based settings |
| `python-multipart` | Multipart form / file upload support |
| `pythonocc-core` | OpenCASCADE geometry engine (conda-forge only) |

---

## 5. Frontend Architecture

```
frontend/
├── index.html
├── vite.config.js        # Vite config, dev server on port 5173
├── package.json
└── src/
    ├── main.jsx          # React root, BrowserRouter
    ├── App.jsx           # Header, route definitions
    ├── index.css         # All styles — plain CSS, no framework
    ├── api/
    │   └── client.js     # Axios instance + uploadPart, listParts, getPart
    ├── components/
    │   └── PartCard.jsx  # Card for dashboard grid — name, size, date, status, link
    └── pages/
        ├── Dashboard.jsx # Upload form + parts grid
        └── PartReport.jsx # Single part detail with geometry table
```

### Key dependencies

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `vite` + `@vitejs/plugin-react` | Build tooling and dev server |

### API base URL
The frontend points to `http://localhost:8000` (defined in `src/api/client.js`). This will need to become an environment variable when deploying.

---

## 6. Database Structure

### `parts` table

| Column | Type | Notes |
|---|---|---|
| `id` | Integer | Primary key, auto-increment |
| `original_name` | String | Original filename from the upload |
| `file_path` | String | Path to saved file in `uploads/` |
| `file_size` | Integer | File size in bytes |
| `upload_time` | DateTime | Server-side timestamp, set on insert |
| `bounding_box_x` | Float | Bounding box X dimension (mm) |
| `bounding_box_y` | Float | Bounding box Y dimension (mm) |
| `bounding_box_z` | Float | Bounding box Z dimension (mm) |
| `volume` | Float | Part volume (mm³) |
| `surface_area` | Float | Total surface area (mm²) |
| `status` | String | Currently always `"uploaded"` |

All geometry columns are nullable. A `null` value means geometry extraction was not attempted or failed — it does not indicate a corrupt record.

### Database setup
Phase 1 uses `Base.metadata.create_all(bind=engine)` on startup to create tables. There are no Alembic migrations yet. See [Known Limitations](#13-known-limitations-and-technical-debt).

---

## 7. File Upload Workflow

End-to-end flow for a file upload:

```
Browser
  └─ User selects .step/.stp file
  └─ POST /parts/upload (multipart/form-data)
        │
        ▼
FastAPI router (routers/parts.py)
  └─ Validate file extension (.step or .stp only — 400 if invalid)
  └─ Generate unique filename: {uuid4_hex}_{original_filename}
  └─ Create uploads/ directory if it doesn't exist
  └─ Write file bytes to uploads/{unique_filename}
        │
        ▼
Geometry service (services/geometry.py)
  └─ Load STEP file with STEPControl_Reader
  └─ Extract bounding box, volume, surface area
  └─ Return dict (all values None if extraction fails)
        │
        ▼
SQLAlchemy
  └─ Create Part record with file metadata + geometry values
  └─ Commit to PostgreSQL
        │
        ▼
Response
  └─ Return PartRead JSON (HTTP 201)
        │
        ▼
Frontend (Dashboard.jsx)
  └─ Prepend new part to parts list state
  └─ Show success message
  └─ PartCard appears in grid immediately
```

### File naming strategy
Uploaded files are stored as `{uuid4_hex}_{original_filename}` (e.g. `a3f8c21d...._bracket_v2.step`). This prevents naming collisions when two users upload files with the same name. The `original_name` field in the database stores the human-readable name for display.

---

## 8. Geometry Extraction Workflow

The geometry service lives entirely in `backend/app/services/geometry.py`. No geometry logic exists anywhere else.

### Libraries used
- `OCC.Core.STEPControl.STEPControl_Reader` — reads and parses the STEP file
- `OCC.Core.IFSelect.IFSelect_RetDone` — status check after file load
- `OCC.Core.Bnd.Bnd_Box` + `OCC.Core.BRepBndLib.brepbndlib` — axis-aligned bounding box
- `OCC.Core.BRepGProp.brepgprop` + `OCC.Core.GProp.GProp_GProps` — volume and surface area via geometric properties integration

### Extraction steps
1. `STEPControl_Reader.ReadFile(file_path)` — parse the STEP file
2. Check return status equals `IFSelect_RetDone` — abort if not
3. `TransferRoots()` + `OneShape()` — assemble all solids into a single compound shape
4. `BRepBndLib.Add(shape, bbox)` → `bbox.Get()` returns `(xmin, ymin, zmin, xmax, ymax, zmax)` — subtract to get dimensions
5. `BRepGProp.VolumeProperties(shape, props)` → `props.Mass()` = volume in mm³
6. `BRepGProp.SurfaceProperties(shape, props)` → `props.Mass()` = surface area in mm²
7. All values rounded to 4 decimal places

### Units
Standard STEP files use millimeters. Values stored in the database are in mm, mm³, and mm² respectively. There is currently no unit normalization — if an unusual STEP file uses different units, values will be wrong. This is a known limitation to address later.

### Fallback behavior
The entire extraction is wrapped in a `try/except`. If OCC is not importable (e.g. running without the conda environment) or the file fails to parse, all geometry values return `None`. The upload succeeds regardless. The `_OCC_AVAILABLE` flag at module level prevents import errors from crashing the backend on startup.

---

## 9. Environment Setup

### Prerequisites
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html) (Windows 64-bit)
- PostgreSQL 14+ running locally
- Node.js 18+

### Create the conda environment (one-time)

```bash
conda create -n aero-ai python=3.11 -y
conda activate aero-ai
conda install -c conda-forge pythonocc-core -y
pip install -r backend/requirements.txt
```

### Why conda and not pip for pythonocc-core?
`pythonocc-core` requires native OpenCASCADE shared libraries that are not bundled in the PyPI wheel for Windows. The conda-forge package includes all native dependencies pre-compiled and properly linked. `pip install pythonocc-core` will fail on Windows with "no matching distribution found."

### Configure the backend environment file

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
DATABASE_URL=postgresql://your_user:your_pass@localhost:5432/aero_db
UPLOAD_DIR=uploads
```

For quick local testing without PostgreSQL, you can use SQLite:
```
DATABASE_URL=sqlite:///./aero_ai.db
```

Note: SQLite is suitable for local development only. PostgreSQL is required for production.

---

## 10. Runtime Commands

### Start the backend

```bash
conda activate aero-ai
cd backend
uvicorn app.main:app --reload
```

- API base: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

> **Important:** always activate the `aero-ai` conda environment before running the backend. Running without it will cause an `ImportError` for pythonocc-core (geometry extraction will silently fall back to null values).

### Start the frontend

```bash
cd frontend
npm install     # first time only
npm run dev
```

- App: `http://localhost:5173`

### Verify pythonocc-core import

```bash
conda activate aero-ai
python -c "from OCC.Core.STEPControl import STEPControl_Reader; from OCC.Core.BRepBndLib import brepbndlib; from OCC.Core.BRepGProp import brepgprop; print('pythonocc-core OK')"
```

---

## 11. Git Workflow and Branch Strategy

### Current branches

| Branch | Purpose |
|---|---|
| `main` | Stable, reviewed code only |
| `aero-dev/phase_1` | Active Phase 1 development |

### Commit history (Phase 1)

```
b6b46d6  Add frontend package lockfile
9cab5b4  feat: implement real STEP geometry extraction with pythonocc-core
f3739e2  feat: add React frontend with dashboard and part report pages
896e0d5  Ignore local SQLite database
e5a34b6  feat: add parts router and geometry placeholder service
d252c9d  feat: add backend scaffolding with FastAPI, SQLAlchemy, and Part model
6e3df40  Claude change
4a172eb  Add project architecture and roadmap docs
8fb8057  Initial commit
```

### Rules
- Do not commit directly to `main`
- Phase 1 work happens on `aero-dev/phase_1`
- Future phases should use their own feature branches (e.g. `aero-dev/phase_2`)
- Commits should be logical and scoped — one concern per commit
- PRs are used to merge phase branches into `main` after review

---

## 12. Key Engineering Decisions

### 1. Synchronous SQLAlchemy (not async)
Chose sync SQLAlchemy for Phase 1 simplicity. FastAPI supports async SQLAlchemy, but async adds complexity (different session patterns, async engine setup) that isn't necessary at this scale. Easy to migrate later when throughput becomes a concern.

### 2. `Base.metadata.create_all` instead of Alembic migrations
Tables are created automatically on startup for now. This is intentional for Phase 1 — it keeps setup to one command. Alembic will be added before any schema changes are needed or before this moves toward production.

### 3. Geometry service as a plain function, not a class
`extract_geometry(file_path)` is a module-level function returning a plain dict. No classes, no dependency injection. This keeps it dead simple and easy to test. When real complexity arrives (e.g. caching shapes, async extraction), it can be refactored without touching the router.

### 4. Graceful OCC fallback
The geometry service checks `_OCC_AVAILABLE` at import time. If OCC is missing, extraction returns `None` values silently. This means the backend runs correctly even without the conda environment activated — geometry just won't be populated. This is intentional: a missing dependency should not crash the upload API.

### 5. UUID-prefixed filenames for uploads
Files are stored as `{uuid4_hex}_{original_name}`. This prevents collisions when multiple users upload files with the same name. The `original_name` column preserves the human-readable name for display.

### 6. No UI library on the frontend
Plain CSS was chosen deliberately for Phase 1. It keeps the dependency footprint small, the styles are fully readable, and there's no framework to upgrade or work around. A component library (e.g. shadcn/ui, Chakra) can be added later when the UI scope justifies it.

### 7. API-first design
The backend is a pure API with no server-rendered views. This keeps backend and frontend concerns fully separated and allows the API to serve future clients (mobile app, other services, Mastercam integration) without changes.

### 8. Flat file storage in `uploads/`
Phase 1 stores files flat in a local directory. No subdirectories, no cloud storage. This is appropriate for a single-developer local setup. The storage layer is isolated enough (referenced only by `file_path` in the DB and the upload handler) that swapping in S3 or MinIO later is straightforward.

---

## 13. Known Limitations and Technical Debt

| Item | Impact | When to fix |
|---|---|---|
| No Alembic migrations | Any schema change requires dropping and recreating tables manually | Before first schema change after Phase 1 |
| No authentication or authorization | Any user can upload or read any part | Before any multi-user or production deployment |
| API base URL hardcoded in frontend | `http://localhost:8000` is in `src/api/client.js` | Before any deployment or environment config |
| No geometry unit normalization | STEP files that use units other than mm will produce incorrect values | When non-standard files are encountered |
| No upload file size limit | Large files could strain the server | Before production |
| No error logging for geometry failures | Extraction failures are silently swallowed by `except Exception: pass` | Before production debugging becomes necessary |
| Flat local file storage | Not suitable for multi-user or production deployments | Phase 3–4 timeframe, alongside authentication |
| No pagination on `GET /parts/` | Will slow down as the parts database grows | When the parts list becomes large |
| SQLite for local dev only | SQLite does not support all PostgreSQL features | Not a blocker, just a reminder |
| `status` field always `"uploaded"` | Placeholder for a future processing pipeline | When background geometry processing is added |

---

## 14. Remaining Phase 1 Tasks

Phase 1 MVP is functionally complete. The following items are polish/hardening that would be appropriate before merging to `main`:

- [ ] Add Alembic for database migrations
- [ ] Set API base URL via environment variable in frontend (`VITE_API_URL`)
- [ ] Add file size validation on upload (e.g. 100MB limit)
- [ ] Add error logging in geometry service instead of silent `pass`
- [ ] Write a brief test for the geometry extraction function
- [ ] Merge `aero-dev/phase_1` into `main` via PR

---

## 15. Planned Future Phases

Full roadmap is in `docs/ROADMAP.md`. Summary:

| Phase | Focus |
|---|---|
| **Phase 2** | Interactive 3D model viewer (Three.js + OCC STEP → mesh export) |
| **Phase 3** | Feature extraction — holes, pockets, slots, fillets, chamfers, thin walls |
| **Phase 4** | Manufacturability analysis — warnings for difficult features, tool access, setup complexity |
| **Phase 5** | Shop intelligence — machine database, material database, capability matching |
| **Phase 6** | Cost estimation — material, setup, programming, and machine time |
| **Phase 7** | AI manufacturing assistant — recommendations, similar job search, programmer assistance |
| **Long-term** | Mastercam integration, ERP integration, multi-company enterprise support |

---

## 16. Notes for Future Contributors

### Running the project
Always activate the conda environment before starting the backend. The frontend is a standard npm project with no special environment requirements.

```bash
# Terminal 1 — backend
conda activate aero-ai
cd backend
uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

### Where things live
- All geometry logic: `backend/app/services/geometry.py` — do not put OCC code anywhere else
- All API routes: `backend/app/routers/parts.py` — add new routers here and register in `main.py`
- All DB models: `backend/app/models/` — one file per domain entity
- All Pydantic schemas: `backend/app/schemas/` — keep separate from models
- Frontend API calls: `frontend/src/api/client.js` — all Axios calls go here, not in components

### What not to add yet
- No AI/ML recommendations until Phase 7
- No CNC code generation at any phase (out of scope for this tool)
- No machining-specific logic until Phase 4 feature extraction is complete
- No authentication until multi-user support is explicitly planned

### Philosophy
This project is built for correctness over convenience. When adding geometry logic, use exact B-rep calculations via OpenCASCADE — do not use mesh approximations or heuristics. The manufacturing data this system produces will inform real quoting and programming decisions.
