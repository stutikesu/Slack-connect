import { useState, useContext } from 'react'
import axios from 'axios'
import { WorkspaceContext } from '../contexts/WorkspaceContext'

interface Channel {
  id: string
  name: string
  is_private: boolean
}

interface MessageSendProps {
  channels: Channel[]
  selectedChannel: string
  setSelectedChannel: (channelId: string) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

const MessageSend = ({
  channels,
  selectedChannel,
  setSelectedChannel,
  onSuccess,
  onError
}: MessageSendProps) => {
  const { selectedWorkspace } = useContext(WorkspaceContext)
  const [message, setMessage] = useState<string>('')
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [relativeTime, setRelativeTime] = useState<number>(0)
  const [scheduleType, setScheduleType] = useState<'absolute' | 'relative'>('absolute')
  const [loading, setLoading] = useState<boolean>(false)

  // Send a message immediately
  const sendMessage = async () => {
    if (!selectedWorkspace) {
      onError('No Slack workspace connected')
      return
    }
    
    if (!selectedChannel || !message) {
      onError('Please select a channel and enter a message')
      return
    }

    setLoading(true)

    try {
      await axios.post('/api/messages/send', {
        workspaceId: selectedWorkspace.workspace_id,
        channelId: selectedChannel,
        message
      })

      onSuccess('Message sent successfully')
      setMessage('')
    } catch (err) {
      onError('Failed to send message')
      console.error('Error sending message:', err)
    } finally {
      setLoading(false)
    }
  }

  // Schedule a message for future delivery
  const scheduleMessage = async () => {
    if (!selectedWorkspace) {
      onError('No Slack workspace connected')
      return
    }
    
    if (!selectedChannel || !message) {
      onError('Please fill in all fields')
      return
    }

    let scheduledDate: Date;
    const now = new Date();
    
    if (scheduleType === 'absolute') {
      if (!scheduledTime) {
        onError('Please select a date and time')
        return
      }
      
      scheduledDate = new Date(scheduledTime)
      
      if (isNaN(scheduledDate.getTime())) {
        onError('Please select a valid date and time')
        return
      }
      
      // Allow scheduling for the same day, but ensure it's in the future
      if (scheduledDate.getTime() <= now.getTime()) {
        onError('Please select a future time (even if it\'s today)')
        return
      }
    } else {
      // Relative time scheduling
      if (!relativeTime || relativeTime <= 0) {
        onError('Please enter a valid time in minutes')
        return
      }
      
      // Calculate future time based on relative minutes
      scheduledDate = new Date(now.getTime() + relativeTime * 60000)
    }

    setLoading(true)

    try {
      const channelName = channels.find(c => c.id === selectedChannel)?.name || ''

      await axios.post('/api/messages/schedule', {
        workspaceId: selectedWorkspace.workspace_id,
        channelId: selectedChannel,
        channelName,
        message,
        scheduledTime: scheduledDate.toISOString()
      })

      onSuccess('Message scheduled successfully')
      setMessage('')
      setScheduledTime('')
      setRelativeTime(0)
    } catch (err) {
      onError('Failed to schedule message')
      console.error('Error scheduling message:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="form-group">
        <label htmlFor="channel">Channel:</label>
        <select
          id="channel"
          className="channel-select"
          value={selectedChannel}
          onChange={(e) => setSelectedChannel(e.target.value)}
          disabled={loading || channels.length === 0}
        >
          {channels.length === 0 && <option value="">No channels available</option>}
          {channels.map(channel => (
            <option key={channel.id} value={channel.id}>
              {channel.is_private ? '🔒' : '#'} {channel.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="message">Message:</label>
        <textarea
          id="message"
          className="form-control"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loading}
          placeholder="Type your message here..."
        />
      </div>

      <div className="form-group">
        <label>Schedule type:</label>
        <div className="schedule-type-selector">
          <label>
            <input
              type="radio"
              name="scheduleType"
              value="absolute"
              checked={scheduleType === 'absolute'}
              onChange={() => setScheduleType('absolute')}
              disabled={loading}
            />
            Specific date and time
          </label>
          <label>
            <input
              type="radio"
              name="scheduleType"
              value="relative"
              checked={scheduleType === 'relative'}
              onChange={() => setScheduleType('relative')}
              disabled={loading}
            />
            Minutes from now
          </label>
        </div>
      </div>

      {scheduleType === 'absolute' ? (
        <div className="form-group">
          <label htmlFor="scheduled-time">Schedule for:</label>
          <input
            id="scheduled-time"
            type="datetime-local"
            className="datetime-picker"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            disabled={loading}
            // Set min to the current date without time to allow selecting any time today
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      ) : (
        <div className="form-group">
          <label htmlFor="relative-time">Minutes from now:</label>
          <input
            id="relative-time"
            type="number"
            className="form-control"
            value={relativeTime}
            onChange={(e) => setRelativeTime(parseInt(e.target.value))}
            min="1"
            disabled={loading}
            placeholder="Enter minutes"
          />
          <div className="time-presets">
            <button 
              type="button" 
              className="preset-btn" 
              onClick={() => setRelativeTime(15)}
              disabled={loading}
            >
              15m
            </button>
            <button 
              type="button" 
              className="preset-btn" 
              onClick={() => setRelativeTime(30)}
              disabled={loading}
            >
              30m
            </button>
            <button 
              type="button" 
              className="preset-btn" 
              onClick={() => setRelativeTime(60)}
              disabled={loading}
            >
              1h
            </button>
            <button 
              type="button" 
              className="preset-btn" 
              onClick={() => setRelativeTime(180)}
              disabled={loading}
            >
              3h
            </button>
            <button 
              type="button" 
              className="preset-btn" 
              onClick={() => setRelativeTime(1440)}
              disabled={loading}
            >
              1d
            </button>
          </div>
        </div>
      )}

      <div>
        {(scheduleType === 'absolute' && scheduledTime) || (scheduleType === 'relative' && relativeTime > 0) ? (
          <button
            onClick={scheduleMessage}
            className="btn btn-primary"
            disabled={loading || !selectedChannel || !message || 
              (scheduleType === 'absolute' && !scheduledTime) || 
              (scheduleType === 'relative' && relativeTime <= 0) || 
              !selectedWorkspace}
          >
            {loading ? 'Scheduling...' : 'Schedule Message'}
          </button>
        ) : (
          <button
            onClick={sendMessage}
            className="btn btn-primary"
            disabled={loading || !selectedChannel || !message || !selectedWorkspace}
          >
            {loading ? 'Sending...' : 'Send Now'}
          </button>
        )}
      </div>
    </div>
  )
}

export default MessageSend