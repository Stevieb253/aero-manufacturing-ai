import { Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import PartReport from './pages/PartReport.jsx'

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="header-title">Aero Manufacturing AI</Link>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/parts/:id" element={<PartReport />} />
        </Routes>
      </main>
    </div>
  )
}
