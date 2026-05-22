import { Component, Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ArcballControls, useGLTF, Bounds, useBounds, Center, Html, useProgress } from '@react-three/drei'

const API_BASE = 'http://localhost:8000'

// Standard engineering views: direction vector + camera up vector
const VIEWS = {
  iso:    { dir: [ 1,  1,  1], up: [0,  1,  0] },
  front:  { dir: [ 0,  0,  1], up: [0,  1,  0] },
  back:   { dir: [ 0,  0, -1], up: [0,  1,  0] },
  right:  { dir: [ 1,  0,  0], up: [0,  1,  0] },
  left:   { dir: [-1,  0,  0], up: [0,  1,  0] },
  top:    { dir: [ 0,  1,  0], up: [0,  0, -1] }, // up=-Z avoids gimbal lock
  bottom: { dir: [ 0, -1,  0], up: [0,  0,  1] },
}

const VIEW_LABELS = ['iso', 'front', 'back', 'right', 'left', 'top', 'bottom']

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

function Model({ url }) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()
  useEffect(() => {
    bounds.refresh(scene).fit()
  }, [scene, bounds])
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

// Moves camera to a preset direction while preserving zoom distance
function ViewSetter({ targetView, onViewSet }) {
  const { camera } = useThree()
  useEffect(() => {
    if (!targetView) return
    const dist = camera.position.length() || 100
    const [dx, dy, dz] = targetView.dir
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
    camera.position.set((dx / len) * dist, (dy / len) * dist, (dz / len) * dist)
    camera.up.set(...targetView.up)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    onViewSet()
  }, [targetView]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Re-fits camera to model bounding box via Bounds API
function CameraReset({ resetKey }) {
  const bounds = useBounds()
  useEffect(() => {
    if (resetKey > 0) bounds.refresh().fit()
  }, [resetKey, bounds])
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

export default function ModelViewer({ partId, meshAvailable }) {
  const [resetKey, setResetKey]   = useState(0)
  const [targetView, setTargetView] = useState(null)
  const [controlKey, setControlKey] = useState(0) // remounts ArcballControls on view change

  if (!meshAvailable) {
    return <div className="viewer-fallback">3D model not available for this part.</div>
  }

  const url = `${API_BASE}/parts/${partId}/mesh`

  function handleReset() {
    setResetKey(k => k + 1)
    setControlKey(k => k + 1)
  }

  function handleView(name) {
    setTargetView(VIEWS[name])
  }

  return (
    <ViewerErrorBoundary>
      <div className="viewer-container">
        <button className="viewer-btn viewer-btn--reset" onClick={handleReset}>
          Reset
        </button>

        <Canvas camera={{ position: [1, 1, 1], fov: 45 }} gl={{ antialias: true }}>
          <directionalLight position={[5, 8, 5]}   intensity={1.8} />
          <directionalLight position={[-6, 2, -2]} intensity={0.5} />
          <directionalLight position={[0, -4, -6]} intensity={0.2} />
          <ambientLight intensity={0.25} />

          <Bounds fit margin={1.3}>
            <Suspense fallback={<Loader />}>
              <Model url={url} />
            </Suspense>
            <CameraReset resetKey={resetKey} />
          </Bounds>

          <ViewSetter
            targetView={targetView}
            onViewSet={() => { setTargetView(null); setControlKey(k => k + 1) }}
          />

          <ArcballControls key={controlKey} makeDefault />
        </Canvas>

        <div className="viewer-toolbar">
          {VIEW_LABELS.map(name => (
            <button
              key={name}
              className="viewer-btn"
              onClick={() => handleView(name)}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </ViewerErrorBoundary>
  )
}
