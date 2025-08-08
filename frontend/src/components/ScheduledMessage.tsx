import { useState, useContext } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

interface ScheduledMessageItem {
  id: number
  workspace_id: string
  channel_id: string
  channel_name: string
  message: string
  scheduled_time: number
  status: string
  created_at: number
}

interface ScheduledMessageProps {
  scheduledMessages: ScheduledMessageItem[]
  setScheduledMessages: React.Dispatch<React.SetStateAction<ScheduledMessageItem[]>>
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onRefresh: () => void
}

const ScheduledMessage = ({
  scheduledMessages,
  setScheduledMessages,
  onSuccess,
  onError,
  onRefresh
}: ScheduledMessageProps) => {
  const { selectedWorkspace } = useContext(WorkspaceContext)
  const [loading, setLoading] = useState<boolean>(false)

  // Format timestamp to readable date and time
  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'MMM d, yyyy h:mm a')
  }

  // Cancel a scheduled message
  const cancelScheduledMessage = async (messageId: number) => {
    if (!selectedWorkspace) {
      onError('No Slack workspace connected')
      return
    }
    
    setLoading(true)

    try {
      await axios.delete(`/api/messages/scheduled/${messageId}`)

      onSuccess('Message cancelled successfully')

      // Update the local list of scheduled messages
      setScheduledMessages(scheduledMessages.filter(msg => msg.id !== messageId))
    } catch (err) {
      onError('Failed to cancel message')
      console.error('Error cancelling message:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!selectedWorkspace) {
    return <div className="alert alert-warning">No Slack workspace connected</div>
  }

  return (
    <div>
      <h2>Scheduled Messages</h2>

      {scheduledMessages.length === 0 ? (
        <p>No scheduled messages found.</p>
      ) : (
        <ul className="message-list">
          {scheduledMessages.map(msg => (
            <li key={msg.id} className="message-item">
              <div className="message-content">
                <div>
                  <strong>Channel:</strong> {msg.channel_name}
                </div>
                <div>
                  <strong>Message:</strong> {msg.message}
                </div>
                <div>
                  <strong>Scheduled for:</strong> {formatTimestamp(msg.scheduled_time)}
                </div>
              </div>
              <div className="message-actions">
                <button
                  onClick={() => cancelScheduledMessage(msg.id)}
                  className="btn btn-danger"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onRefresh}
        className="btn btn-secondary"
        disabled={loading || !selectedWorkspace}
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}

export default ScheduledMessage