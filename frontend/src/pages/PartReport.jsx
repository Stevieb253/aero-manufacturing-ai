import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPart } from '../api/client.js'
import ModelViewer from '../components/ModelViewer.jsx'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString()
}

function GeomCard({ label, value, unit }) {
  const hasValue = value !== null && value !== undefined
  return (
    <div className="geom-card">
      <div className="geom-label">{label}</div>
      <div className="geom-value">
        {hasValue
          ? <>{value.toFixed(3)}<span className="geom-unit">{unit}</span></>
          : <span className="pending">—</span>
        }
      </div>
    </div>
  )
}

export default function PartReport() {
  const { id } = useParams()
  const [part, setPart] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getPart(id)
      .then(res => setPart(res.data))
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Part not found.')
        } else {
          setError('Failed to load part.')
        }
      })
  }, [id])

  if (error) return <p className="page-error">{error}</p>
  if (!part) return <p className="page-loading">Loading...</p>

  return (
    <div>
      <Link to="/" className="report-back">← Back to dashboard</Link>

      <div className="report-card">
        <h2 className="report-title">{part.original_name}</h2>

        {/* 3D Viewer */}
        <div className="report-section">
          <h3>3D Model</h3>
          <ModelViewer partId={part.id} meshAvailable={part.mesh_path !== null} />
        </div>

        {/* Geometry — primary section */}
        <div className="report-section">
          <h3>Geometry</h3>
          <div className="geom-grid">
            <GeomCard label="Bounding Box X" value={part.bounding_box_x} unit=" mm" />
            <GeomCard label="Bounding Box Y" value={part.bounding_box_y} unit=" mm" />
            <GeomCard label="Bounding Box Z" value={part.bounding_box_z} unit=" mm" />
            <GeomCard label="Volume"          value={part.volume}         unit=" mm³" />
            <GeomCard label="Surface Area"    value={part.surface_area}   unit=" mm²" />
          </div>
        </div>

        {/* File info — secondary */}
        <div className="report-section report-section--secondary">
          <h3>File Info</h3>
          <table className="report-table">
            <tbody>
              <tr>
                <td>File name</td>
                <td>{part.original_name}</td>
              </tr>
              <tr>
                <td>File size</td>
                <td>{formatBytes(part.file_size)}</td>
              </tr>
              <tr>
                <td>Uploaded</td>
                <td>{formatDate(part.upload_time)}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>{part.status}</td>
              </tr>
              <tr>
                <td>3D mesh</td>
                <td>{part.mesh_path ? 'Available' : 'Not generated'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
