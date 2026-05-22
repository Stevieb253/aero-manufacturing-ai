import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPart } from '../api/client.js'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString()
}

function GeomValue({ value, unit = 'mm' }) {
  if (value === null || value === undefined) {
    return <span className="pending">Pending analysis</span>
  }
  return <span>{value.toFixed(4)} {unit}</span>
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
        <h2>{part.original_name}</h2>

        <div className="report-section">
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
            </tbody>
          </table>
        </div>

        <div className="report-section">
          <h3>Geometry</h3>
          <table className="report-table">
            <tbody>
              <tr>
                <td>Bounding box X</td>
                <td><GeomValue value={part.bounding_box_x} /></td>
              </tr>
              <tr>
                <td>Bounding box Y</td>
                <td><GeomValue value={part.bounding_box_y} /></td>
              </tr>
              <tr>
                <td>Bounding box Z</td>
                <td><GeomValue value={part.bounding_box_z} /></td>
              </tr>
              <tr>
                <td>Volume</td>
                <td><GeomValue value={part.volume} unit="mm³" /></td>
              </tr>
              <tr>
                <td>Surface area</td>
                <td><GeomValue value={part.surface_area} unit="mm²" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
