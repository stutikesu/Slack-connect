import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

const Home = () => {
  const { workspaces } = useContext(WorkspaceContext)

  return (
    <div>
      <h1>Welcome to Slack Connect</h1>
      <p>
        Connect your Slack workspace, send messages immediately, and schedule messages for future delivery.
      </p>

      {workspaces.length === 0 ? (
        <div>
          <p>You don't have any connected workspaces yet.</p>
          <Link to="/connect" className="btn btn-primary">
            Connect a Workspace
          </Link>
        </div>
      ) : (
        <div>
          <p>You have {workspaces.length} connected workspace(s).</p>
          <Link to="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      )}

      <div className="card">
        <h2>Features</h2>
        <ul>
          <li>Connect to your Slack workspace securely</li>
          <li>Send messages to any channel immediately</li>
          <li>Schedule messages for future delivery</li>
          <li>Manage your scheduled messages</li>
        </ul>
      </div>
    </div>
  )
}

export default Home