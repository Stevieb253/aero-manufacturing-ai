import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ArcballControls, useGLTF, Bounds, useBounds, Center, Html, useProgress } from '@react-three/drei'

const API_BASE = 'http://localhost:8000'

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <span style={{ color: '#888', fontSize: '0.8rem', fontFamily: 'sans-serif' }}>
        Loading… {Math.round(progress)}%
      </span>
    </Html>
  )
}

// Wraps the model in a rotation group driven by slider state.
// ArcballControls is never touched — it orbits the rotated group from outside.
function Model({ url, rotation }) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()

  useEffect(() => {
    bounds.refresh(scene).fit()
  }, [scene, bounds])

  return (
    <group rotation={[rotation.x, rotation.y, rotation.z]}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  )
}

// Re-fits camera and resets ArcballControls target so pan drift is cleared.
// bounds.fit() alone moves the camera but leaves ArcballControls orbiting
// the old (panned) target — resetting target to origin fixes that.
function CameraReset({ resetKey, controlsRef }) {
  const bounds = useBounds()
  useEffect(() => {
    if (resetKey > 0) {
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0)
        controlsRef.current.update()
      }
      bounds.refresh().fit()
    }
  }, [resetKey, bounds, controlsRef])
  return null
}

class ViewerErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) {
      return <div className="viewer-fallback viewer-error">Failed to load 3D model.</div>
    }
    return this.props.children
  }
}

function toDeg(rad) { return Math.round(rad * 180 / Math.PI) }
function toRad(deg) { return deg * Math.PI / 180 }

export default function ModelViewer({ partId, meshAvailable }) {
  const [resetKey, setResetKey] = useState(0)
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
  const controlsRef = useRef()

  if (!meshAvailable) {
    return <div className="viewer-fallback">3D model not available for this part.</div>
  }

  const url = `${API_BASE}/parts/${partId}/mesh`

  function setAxis(axis, degrees) {
    setRotation(r => ({ ...r, [axis]: toRad(degrees) }))
  }

  return (
    <ViewerErrorBoundary>
      <div className="viewer-container">
        <button
          className="viewer-btn viewer-btn--reset"
          onClick={() => setResetKey(k => k + 1)}
        >
          Reset View
        </button>

        <Canvas camera={{ position: [1, 1, 1], fov: 45 }} gl={{ antialias: true }}>
          <directionalLight position={[5, 8, 5]}   intensity={1.8} />
          <directionalLight position={[-6, 2, -2]} intensity={0.5} />
          <directionalLight position={[0, -4, -6]} intensity={0.2} />
          <ambientLight intensity={0.25} />

          <Bounds fit margin={1.3}>
            <Suspense fallback={<Loader />}>
              <Model url={url} rotation={rotation} />
            </Suspense>
            <CameraReset resetKey={resetKey} controlsRef={controlsRef} />
          </Bounds>

          {/* Stable — no key prop, never remounted */}
          <ArcballControls ref={controlsRef} makeDefault />
        </Canvas>

        <div className="viewer-hint">
          Drag to rotate · Scroll to zoom · Right-drag to pan
        </div>
      </div>

      {/* Model rotation controls — outside the canvas, no conflict with ArcballControls */}
      <div className="viewer-sliders">
        {['x', 'y', 'z'].map(axis => (
          <div key={axis} className="viewer-slider-row">
            <span className="viewer-slider-label">{axis.toUpperCase()}</span>
            <input
              type="range"
              min={-180}
              max={180}
              value={toDeg(rotation[axis])}
              onChange={e => setAxis(axis, Number(e.target.value))}
            />
            <span className="viewer-slider-value">{toDeg(rotation[axis])}°</span>
          </div>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setRotation({ x: 0, y: 0, z: 0 })}
        >
          Reset Rotation
        </button>
      </div>
    </ViewerErrorBoundary>
  )
}
