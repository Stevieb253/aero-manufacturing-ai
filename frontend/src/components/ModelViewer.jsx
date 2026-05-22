import { Component, Suspense, useEffect, useState } from 'react'
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

function Model({ url }) {
  const { scene } = useGLTF(url)
  const bounds = useBounds()

  // Fit camera to model after GLB is loaded
  useEffect(() => {
    bounds.refresh(scene).fit()
  }, [scene, bounds])

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  )
}

// Reset camera to fit model — driven by external resetKey prop
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
      return (
        <div className="viewer-fallback viewer-error">
          Failed to load 3D model.
        </div>
      )
    }
    return this.props.children
  }
}

export default function ModelViewer({ partId, meshAvailable }) {
  const [resetKey, setResetKey] = useState(0)

  if (!meshAvailable) {
    return (
      <div className="viewer-fallback">
        3D model not available for this part.
      </div>
    )
  }

  const url = `${API_BASE}/parts/${partId}/mesh`

  return (
    <ViewerErrorBoundary>
      <div className="viewer-container">
        <button
          className="viewer-reset-btn"
          onClick={() => setResetKey(k => k + 1)}
        >
          Reset View
        </button>
        <Canvas
          camera={{ position: [1, 1, 1], fov: 45 }}
          gl={{ antialias: true }}
        >
          {/* Key light — strong, from upper-front-right */}
          <directionalLight position={[5, 8, 5]} intensity={1.8} />
          {/* Fill light — soft, from left */}
          <directionalLight position={[-6, 2, -2]} intensity={0.5} />
          {/* Rim light — subtle, from below-back for depth */}
          <directionalLight position={[0, -4, -6]} intensity={0.2} />
          {/* Low ambient so directional lights create visible contrast */}
          <ambientLight intensity={0.25} />

          <Bounds fit margin={1.3}>
            <Suspense fallback={<Loader />}>
              <Model url={url} />
            </Suspense>
            <CameraReset resetKey={resetKey} />
          </Bounds>

          <ArcballControls makeDefault />
        </Canvas>
        <div className="viewer-hint">
          Left drag · rotate &nbsp;·&nbsp; Scroll · zoom &nbsp;·&nbsp; Right drag · pan
        </div>
      </div>
    </ViewerErrorBoundary>
  )
}
