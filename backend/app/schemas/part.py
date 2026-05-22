from datetime import datetime
from pydantic import BaseModel


class PartRead(BaseModel):
    id: int
    original_name: str
    file_path: str
    file_size: int
    upload_time: datetime
    bounding_box_x: float | None
    bounding_box_y: float | None
    bounding_box_z: float | None
    volume: float | None
    surface_area: float | None
    status: str

    model_config = {"from_attributes": True}
