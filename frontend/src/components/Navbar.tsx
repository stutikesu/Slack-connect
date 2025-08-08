import { Link, useLocation } from 'react-router-dom'
import { useContext } from 'react'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

const Navbar = () => {
  const location = useLocation()
  const { selectedWorkspace } = useContext(WorkspaceContext)

  return (
    <nav className="nav">
      <div className="nav-logo">
        <img src="/slack-icon.svg" alt="Slack Connect Logo" />
        <span>Slack Connect</span>
      </div>
      <div className="nav-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Home
        </Link>
        {!selectedWorkspace && (
          <Link to="/connect" className={location.pathname === '/connect' ? 'active' : ''}>
            Connect Workspace
          </Link>
        )}
        {selectedWorkspace && (
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            Dashboard
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar