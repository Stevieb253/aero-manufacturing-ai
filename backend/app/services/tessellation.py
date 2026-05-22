"""
Tessellation service: converts a STEP file to a GLB mesh for browser rendering.

Requires:
  - pythonocc-core (conda-forge): STEP loading and B-rep tessellation
  - trimesh (pip): STL → GLB conversion

GLB files are visualization artifacts only. The original STEP file remains
the source of truth for all precision geometry queries.

LINEAR_DEFLECTION controls mesh quality vs file size (in mm).
Lower values produce finer meshes. 0.1mm is a good default for single
machined parts. Tune per part type if needed in future phases.
"""

import os
import tempfile

LINEAR_DEFLECTION = 0.1  # mm

try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.StlAPI import StlAPI_Writer
    _OCC_AVAILABLE = True
except ImportError:
    _OCC_AVAILABLE = False

try:
    import trimesh
    _TRIMESH_AVAILABLE = True
except ImportError:
    _TRIMESH_AVAILABLE = False


def tessellate_step_to_glb(step_path: str, glb_path: str) -> bool:
    """Load a STEP file, tessellate the B-rep, and export as GLB.

    Returns True on success, False if OCC/trimesh is unavailable or
    the file cannot be processed. Caller can treat False as a soft
    failure — the part record should still be saved without a mesh_path.
    """
    if not _OCC_AVAILABLE or not _TRIMESH_AVAILABLE:
        return False

    try:
        reader = STEPControl_Reader()
        if reader.ReadFile(step_path) != IFSelect_RetDone:
            return False

        reader.TransferRoots()
        shape = reader.OneShape()

        # Tessellate the B-rep into a triangle mesh
        mesh = BRepMesh_IncrementalMesh(shape, LINEAR_DEFLECTION)
        mesh.Perform()

        # Write to a temporary STL, then convert to GLB via trimesh
        tmp_fd, tmp_stl = tempfile.mkstemp(suffix=".stl")
        os.close(tmp_fd)

        try:
            writer = StlAPI_Writer()
            writer.SetASCIIMode(False)
            writer.Write(shape, tmp_stl)

            tm = trimesh.load(tmp_stl, force="mesh")
            os.makedirs(os.path.dirname(glb_path), exist_ok=True)
            tm.export(glb_path)
            return True
        finally:
            if os.path.exists(tmp_stl):
                os.unlink(tmp_stl)

    except Exception:
        return False
