"""
Geometry extraction service using OpenCASCADE (pythonocc-core).

Install via conda-forge before use:
  conda install -c conda-forge pythonocc-core

Returns None for all fields if the file cannot be parsed, so the
upload endpoint never fails due to a geometry error.
"""

try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepBndLib import brepbndlib
    from OCC.Core.Bnd import Bnd_Box
    from OCC.Core.BRepGProp import brepgprop
    from OCC.Core.GProp import GProp_GProps
    _OCC_AVAILABLE = True
except ImportError:
    _OCC_AVAILABLE = False


def extract_geometry(file_path: str) -> dict:
    """Extract bounding box, volume, and surface area from a STEP file.

    All values are in the file's native units (standard STEP uses mm).
    Returns None for all fields if OCC is unavailable or parsing fails.
    """
    result = {
        "bounding_box_x": None,
        "bounding_box_y": None,
        "bounding_box_z": None,
        "volume": None,
        "surface_area": None,
    }

    if not _OCC_AVAILABLE:
        return result

    try:
        reader = STEPControl_Reader()
        status = reader.ReadFile(file_path)
        if status != IFSelect_RetDone:
            return result

        reader.TransferRoots()
        shape = reader.OneShape()

        # Bounding box
        bbox = Bnd_Box()
        brepbndlib.Add(shape, bbox)
        xmin, ymin, zmin, xmax, ymax, zmax = bbox.Get()
        result["bounding_box_x"] = round(xmax - xmin, 4)
        result["bounding_box_y"] = round(ymax - ymin, 4)
        result["bounding_box_z"] = round(zmax - zmin, 4)

        # Volume (mm³)
        vol_props = GProp_GProps()
        brepgprop.VolumeProperties(shape, vol_props)
        result["volume"] = round(vol_props.Mass(), 4)

        # Surface area (mm²)
        surf_props = GProp_GProps()
        brepgprop.SurfaceProperties(shape, surf_props)
        result["surface_area"] = round(surf_props.Mass(), 4)

    except Exception:
        pass

    return result
