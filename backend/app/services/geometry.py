"""
Geometry extraction service.

TODO: Replace placeholder values with real pythonOCC parsing when
      the dependency is set up (Phase 1+).
"""


def extract_geometry(file_path: str) -> dict:
    """Return geometry metadata for a STEP file.

    Currently returns placeholder values. Will be replaced with
    pythonOCC-based extraction in a future phase.
    """
    return {
        "bounding_box_x": None,
        "bounding_box_y": None,
        "bounding_box_z": None,
        "volume": None,
        "surface_area": None,
    }
