import { Link } from 'react-router-dom'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  return new Date(iso).toLocaleString()
}

export default function PartCard({ part }) {
  return (
    <div className="part-card">
      <div className="part-card-name">{part.original_name}</div>
      <div className="part-card-meta">{formatBytes(part.file_size)}</div>
      <div className="part-card-meta">{formatDate(part.upload_time)}</div>
      <span className="part-card-status">{part.status}</span>
      <Link to={`/parts/${part.id}`} className="part-card-link">
        View report →
      </Link>
    </div>
  )
}
