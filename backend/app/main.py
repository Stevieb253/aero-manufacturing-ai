from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine

app = FastAPI(title="Aero Manufacturing AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup (simple approach for Phase 1)
Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}
