"""
Tessellation service: converts a STEP file to a GLB mesh for browser rendering.

Requires:
  - pythonocc-core (conda-forge): STEP loading and B-rep tessellation
  - trimesh (pip): STL → GLB conversion

GLB files are visualization artifacts only. The original STEP file remains
the source of truth for all precision geometry queries.

Tessellation deflection is controlled by settings.tessellation_deflection (mm).
Override in .env via TESSELLATION_DEFLECTION=0.05 for finer meshes.
"""

import logging
import os
import tempfile
import time

logger = logging.getLogger(__name__)

try:
    from OCC.Core.STEPControl import STEPControl_Reader
    from OCC.Core.IFSelect import IFSelect_RetDone
    from OCC.Core.BRepMesh import BRepMesh_IncrementalMesh
    from OCC.Core.StlAPI import StlAPI_Writer
    _OCC_AVAILABLE = True
except ImportError:
    _OCC_AVAILABLE = False
    logger.warning("pythonocc-core not available — tessellation disabled")

try:
    import trimesh
    _TRIMESH_AVAILABLE = True
except ImportError:
    _TRIMESH_AVAILABLE = False
    logger.warning("trimesh not available — tessellation disabled")


def tessellate_step_to_glb(step_path: str, glb_path: str, deflection: float) -> bool:
    """Load a STEP file, tessellate the B-rep, and export as GLB.

    Args:
        step_path:   Absolute or CWD-relative path to the source STEP file.
        glb_path:    Destination path for the output GLB file.
        deflection:  Linear tessellation deflection in mm. Lower = finer mesh.

    Returns True on success, False on any failure. Never raises — callers
    can treat False as a soft failure and proceed without a mesh.
    """
    if not _OCC_AVAILABLE or not _TRIMESH_AVAILABLE:
        logger.warning("Tessellation skipped — OCC or trimesh unavailable")
        return False

    logger.info(f"Tessellation starting: {step_path} (deflection={deflection}mm)")
    t_start = time.perf_counter()

    try:
        # --- Parse STEP ---
        reader = STEPControl_Reader()
        logger.debug(f"Reading STEP file: {step_path}")
        if reader.ReadFile(step_path) != IFSelect_RetDone:
            logger.error(f"STEP parsing failed: {step_path}")
            return False

        reader.TransferRoots()
        shape = reader.OneShape()
        logger.debug("STEP parsed successfully")

        # --- Tessellate B-rep → triangle mesh ---
        logger.debug(f"Tessellating with deflection={deflection}mm")
        mesh = BRepMesh_IncrementalMesh(shape, deflection)
        mesh.Perform()

        # --- Export STL (temp) → GLB ---
        tmp_fd, tmp_stl = tempfile.mkstemp(suffix=".stl")
        os.close(tmp_fd)

        try:
            writer = StlAPI_Writer()
            writer.SetASCIIMode(False)
            writer.Write(shape, tmp_stl)
            logger.debug(f"STL written to temp: {tmp_stl}")

            tm = trimesh.load(tmp_stl, force="mesh")

            # Fix face winding so all normals point outward.
            # OCC's STL writer can produce inconsistent winding across B-rep
            # face boundaries; bad normals survive into the GLB and cause
            # faces to be black even with DoubleSide frontend material.
            tm.fix_normals()

            # Embed a neutral PBR material so the GLB looks reasonable when
            # opened without any frontend material override.
            try:
                from trimesh.visual.material import PBRMaterial
                tm.visual.material = PBRMaterial(
                    name="part",
                    baseColorFactor=[0.6, 0.65, 0.70, 1.0],  # light aluminum, linear
                    metallicFactor=0.05,
                    roughnessFactor=0.55,
                )
            except Exception:
                pass  # older trimesh without PBRMaterial — silently skip

            os.makedirs(os.path.dirname(glb_path), exist_ok=True)
            tm.export(glb_path)

        finally:
            if os.path.exists(tmp_stl):
                os.unlink(tmp_stl)

        elapsed = time.perf_counter() - t_start
        logger.info(f"Tessellation complete: {glb_path} ({elapsed:.2f}s)")
        return True

    except Exception as exc:
        elapsed = time.perf_counter() - t_start
        logger.error(f"Tessellation failed after {elapsed:.2f}s: {exc}")
        return False
