import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.part import Part
from app.schemas.part import PartRead
from app.services.geometry import extract_geometry

router = APIRouter(prefix="/parts", tags=["parts"])

ALLOWED_EXTENSIONS = {".step", ".stp"}


def _validate_extension(filename: str) -> None:
    ext = os.path.splitext(filename)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only .step and .stp files are accepted.",
        )


@router.post("/upload", response_model=PartRead, status_code=201)
def upload_part(file: UploadFile = File(...), db: Session = Depends(get_db)):
    _validate_extension(file.filename)

    unique_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    os.makedirs(settings.upload_dir, exist_ok=True)
    contents = file.file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    geometry = extract_geometry(file_path)

    part = Part(
        original_name=file.filename,
        file_path=file_path,
        file_size=len(contents),
        **geometry,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@router.get("/", response_model=list[PartRead])
def list_parts(db: Session = Depends(get_db)):
    return db.query(Part).order_by(Part.upload_time.desc()).all()


@router.get("/{part_id}", response_model=PartRead)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part
