import { Component, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Bounds, Html, useProgress } from '@react-three/drei'

const API_BASE = 'http://localhost:8000'

// Displays loading progress inside the WebGL canvas
function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <span style={{ color: '#aaa', fontSize: '0.8rem' }}>
        {Math.round(progress)}%
      </span>
    </Html>
  )
}

// Loads and renders the GLB via useGLTF (Suspense-based)
function Model({ url }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

// Catches GLB load errors so the rest of the page stays functional
class ViewerErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
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
  if (!meshAvailable) {
    return (
      <div className="viewer-fallback">
        3D model not yet available for this part.
      </div>
    )
  }

  const url = `${API_BASE}/parts/${partId}/mesh`

  return (
    <ViewerErrorBoundary>
      <div className="viewer-container">
        <Canvas camera={{ position: [1, 1, 1], fov: 45 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, -5, -5]} intensity={0.3} />
          <Suspense fallback={<Loader />}>
            <Bounds fit clip observe margin={1.3}>
              <Model url={url} />
            </Bounds>
          </Suspense>
          <OrbitControls makeDefault />
        </Canvas>
        <div className="viewer-hint">Drag to rotate · Scroll to zoom</div>
      </div>
    </ViewerErrorBoundary>
  )
}
