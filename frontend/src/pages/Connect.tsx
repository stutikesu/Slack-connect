import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

const Connect = () => {
  const { workspaces, loading, error, fetchWorkspaces } = useContext(WorkspaceContext)
  const navigate = useNavigate()

  useEffect(() => {
    // Refresh the workspaces list
    fetchWorkspaces()
  }, [])

  const handleConnect = () => {
    // Redirect to the backend OAuth endpoint
    window.location.href = '/api/auth/slack'
  }

  return (
    <div>
      <h1>Connect to Slack</h1>
      <p>
        Connect your Slack workspace to send and schedule messages. You'll be redirected to Slack to authorize this application.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <button onClick={handleConnect} className="btn btn-primary" disabled={loading}>
        {loading ? 'Loading...' : 'Connect to Slack'}
      </button>

      {workspaces.length > 0 && (
        <div className="card">
          <h2>Connected Workspaces</h2>
          <div className="workspace-list">
            {workspaces.map((workspace) => (
              <div key={workspace.workspace_id} className="workspace-card">
                <div className="workspace-name">{workspace.workspace_name}</div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary"
                >
                  Go to Dashboard
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Connect