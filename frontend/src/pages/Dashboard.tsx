import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { WorkspaceContext } from '../contexts/WorkspaceContext'
import MessageSend from '../components/MessageSend'
import ScheduledMessage from '../components/ScheduledMessage'

interface Channel {
  id: string
  name: string
  is_private: boolean
}

interface ScheduledMessage {
  id: number
  workspace_id: string
  channel_id: string
  channel_name: string
  message: string
  scheduled_time: number
  status: string
  created_at: number
}

const Dashboard = () => {
  const { selectedWorkspace, workspaces, selectWorkspace } = useContext(WorkspaceContext)
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'send' | 'scheduled'>('send')
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Redirect to connect page if no workspace is selected
  useEffect(() => {
    if (workspaces.length === 0) {
      navigate('/connect')
    }
  }, [workspaces, navigate])

  // Fetch channels when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      fetchChannels()
    }
  }, [selectedWorkspace])

  // Fetch scheduled messages when tab changes to scheduled
  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchScheduledMessages()
    }
  }, [activeTab])

  // Fetch channels for the selected workspace
  const fetchChannels = async () => {
    if (!selectedWorkspace) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`/api/messages/channels/${selectedWorkspace.workspace_id}`)
      setChannels(response.data.channels)

      // Select the first channel by default
      if (response.data.channels.length > 0 && !selectedChannel) {
        setSelectedChannel(response.data.channels[0].id)
      }
    } catch (err) {
      setError('Failed to fetch channels')
      console.error('Error fetching channels:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch scheduled messages
  const fetchScheduledMessages = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get('/api/messages/scheduled')
      setScheduledMessages(response.data.messages)
    } catch (err) {
      setError('Failed to fetch scheduled messages')
      console.error('Error fetching scheduled messages:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle success messages
  const handleSuccess = (message: string) => {
    setSuccess(message)
    setError(null)
  }

  // Handle error messages
  const handleError = (message: string) => {
    setError(message)
    setSuccess(null)
  }

  // Handle workspace change
  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const workspaceId = e.target.value
    const workspace = workspaces.find(w => w.workspace_id === workspaceId)
    if (workspace) {
      selectWorkspace(workspace)
      setSelectedChannel('')
    }
  }

  if (!selectedWorkspace) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Workspace selector */}
      {workspaces.length > 1 && (
        <div className="form-group">
          <label htmlFor="workspace">Workspace:</label>
          <select
            id="workspace"
            className="form-control"
            value={selectedWorkspace.workspace_id}
            onChange={handleWorkspaceChange}
          >
            {workspaces.map(workspace => (
              <option key={workspace.workspace_id} value={workspace.workspace_id}>
                {workspace.workspace_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Success and error messages */}
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tab-container">
        <div className="tabs">
          <div
            className={`tab ${activeTab === 'send' ? 'active' : ''}`}
            onClick={() => setActiveTab('send')}
          >
            Send Message
          </div>
          <div
            className={`tab ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduled')}
          >
            Scheduled Messages
          </div>
        </div>

        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <MessageSend
            channels={channels}
            selectedChannel={selectedChannel}
            setSelectedChannel={setSelectedChannel}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        )}

        {/* Scheduled Messages Tab */}
        {activeTab === 'scheduled' && (
          <ScheduledMessage
            scheduledMessages={scheduledMessages}
            setScheduledMessages={setScheduledMessages}
            onSuccess={handleSuccess}
            onError={handleError}
            onRefresh={fetchScheduledMessages}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard