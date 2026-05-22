from datetime import datetime
from sqlalchemy import Float, Integer, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Part(Base):
    __tablename__ = "parts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    original_name: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)  # bytes
    upload_time: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Path to generated GLB mesh file (populated after tessellation)
    mesh_path: Mapped[str | None] = mapped_column(String, nullable=True)

    # Geometry — populated by geometry service (pythonocc-core)
    bounding_box_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    bounding_box_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    bounding_box_z: Mapped[float | None] = mapped_column(Float, nullable=True)
    volume: Mapped[float | None] = mapped_column(Float, nullable=True)
    surface_area: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[str] = mapped_column(String, default="uploaded")
