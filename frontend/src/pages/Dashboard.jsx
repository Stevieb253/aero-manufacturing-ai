import { useState, useEffect, useRef } from 'react'
import { uploadPart, listParts } from '../api/client.js'
import PartCard from '../components/PartCard.jsx'

export default function Dashboard() {
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadStatus, setUploadStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchParts()
  }, [])

  async function fetchParts() {
    try {
      const res = await listParts()
      setParts(res.data)
    } catch {
      // leave parts empty on error
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    const file = fileInputRef.current?.files[0]
    if (!file) return

    setUploadStatus('loading')
    setUploadMessage('Uploading...')

    try {
      const res = await uploadPart(file)
      setParts(prev => [res.data, ...prev])
      setUploadStatus('success')
      setUploadMessage(`"${res.data.original_name}" uploaded successfully.`)
      fileInputRef.current.value = ''
    } catch (err) {
      const detail = err.response?.data?.detail ?? 'Upload failed.'
      setUploadStatus('error')
      setUploadMessage(detail)
    }
  }

  return (
    <div>
      <div className="upload-section">
        <h2>Upload Part</h2>
        <form onSubmit={handleUpload}>
          <div className="upload-row">
            <input
              ref={fileInputRef}
              type="file"
              accept=".step,.stp"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploadStatus === 'loading'}
            >
              {uploadStatus === 'loading' ? 'Uploading…' : 'Upload'}
            </button>
          </div>
          {uploadMessage && (
            <p className={`upload-status ${uploadStatus}`}>{uploadMessage}</p>
          )}
        </form>
      </div>

      <div className="parts-section">
        <h2>Uploaded Parts ({parts.length})</h2>
        {loading ? (
          <p className="page-loading">Loading...</p>
        ) : parts.length === 0 ? (
          <p className="empty-state">No parts uploaded yet. Upload a .step or .stp file to get started.</p>
        ) : (
          <div className="parts-grid">
            {parts.map(part => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
