import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.part import Part
from app.schemas.part import PartRead
from app.services.geometry import extract_geometry
from app.services.tessellation import tessellate_step_to_glb

logger = logging.getLogger(__name__)
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

    stem = f"{uuid.uuid4().hex}_{file.filename}"

    steps_dir = os.path.join(settings.upload_dir, "steps")
    meshes_dir = os.path.join(settings.upload_dir, "meshes")
    os.makedirs(steps_dir, exist_ok=True)
    os.makedirs(meshes_dir, exist_ok=True)

    step_path = os.path.join(steps_dir, stem)
    contents = file.file.read()
    with open(step_path, "wb") as f:
        f.write(contents)

    logger.info(f"Extracting geometry: {step_path}")
    geometry = extract_geometry(step_path)
    logger.info(f"Geometry extraction complete for: {file.filename}")

    glb_filename = os.path.splitext(stem)[0] + ".glb"
    glb_path = os.path.join(meshes_dir, glb_filename)
    mesh_ok = tessellate_step_to_glb(
        step_path, glb_path, deflection=settings.tessellation_deflection
    )
    if not mesh_ok:
        logger.warning(f"Tessellation failed for {file.filename} — upload will proceed without mesh")

    part = Part(
        original_name=file.filename,
        file_path=step_path,
        file_size=len(contents),
        mesh_path=glb_path if mesh_ok else None,
        **geometry,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return part


@router.get("/", response_model=list[PartRead])
def list_parts(db: Session = Depends(get_db)):
    return db.query(Part).order_by(Part.upload_time.desc()).all()


@router.get("/{part_id}/mesh")
def get_part_mesh(part_id: int, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    if not part.mesh_path or not os.path.exists(part.mesh_path):
        raise HTTPException(status_code=404, detail="Mesh not available for this part")
    return FileResponse(
        part.mesh_path,
        media_type="model/gltf-binary",
        filename=f"part_{part_id}.glb",
    )


@router.get("/{part_id}", response_model=PartRead)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = db.query(Part).filter(Part.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part
