import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Connect from './pages/Connect'
import Dashboard from './pages/Dashboard'
import Navbar from './components/Navbar'
import { WorkspaceProvider } from './contexts/WorkspaceContext'

function App() {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if the URL has a connected parameter (after OAuth redirect)
    const params = new URLSearchParams(location.search)
    const connected = params.get('connected')
    const workspace = params.get('workspace')

    if (connected === 'true' && workspace) {
      setIsConnected(true)
      // Remove the query parameters from the URL
      navigate('/dashboard', { replace: true })
    }
  }, [location, navigate])

  return (
    <WorkspaceProvider>
      <div className="container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </WorkspaceProvider>
  )
}

export default App