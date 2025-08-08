import express from 'express';
import axios from 'axios';
import { db } from '../database/db';
import { getValidToken } from '../services/token';

const router = express.Router();

// Get channels for a workspace
router.get('/channels/:workspaceId', async (req, res) => {
  const { workspaceId } = req.params;

  try {
    // Get a valid token for the workspace
    const token = await getValidToken(workspaceId);

    // Call Slack API to get the list of channels
    const response = await axios.get('https://slack.com/api/conversations.list', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        types: 'public_channel,private_channel'
      }
    });

    const { ok, channels } = response.data;

    if (!ok) {
      return res.status(400).json({ error: 'Failed to fetch channels' });
    }

    // Format the channels for the frontend
    const formattedChannels = channels.map((channel: any) => ({
      id: channel.id,
      name: channel.name,
      is_private: channel.is_private
    }));

    res.json({ channels: formattedChannels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Send a message immediately
router.post('/send', async (req, res) => {
  const { workspaceId, channelId, message } = req.body;

  if (!workspaceId || !channelId || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get a valid token for the workspace
    const token = await getValidToken(workspaceId);

    // Call Slack API to send the message
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channelId,
        text: message
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { ok, error } = response.data;

    if (!ok) {
      return res.status(400).json({ error: `Failed to send message: ${error}` });
    }

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Schedule a message for future delivery
router.post('/schedule', async (req, res) => {
  const { workspaceId, channelId, channelName, message, scheduledTime } = req.body;

  if (!workspaceId || !channelId || !channelName || !message || !scheduledTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const scheduledTimestamp = new Date(scheduledTime).getTime() / 1000;
  const now = Math.floor(Date.now() / 1000);

  // Allow scheduling for the same day, but ensure it's in the future
  if (scheduledTimestamp <= now) {
    return res.status(400).json({ error: 'Scheduled time must be in the future (even if it\'s today)' });
  }

  // Store the scheduled message in the database
  db.run(
    `INSERT INTO scheduled_messages 
    (workspace_id, channel_id, channel_name, message, scheduled_time, created_at) 
    VALUES (?, ?, ?, ?, ?, ?)`,
    [workspaceId, channelId, channelName, message, scheduledTimestamp, now],
    function(err) {
      if (err) {
        console.error('Error scheduling message:', err);
        return res.status(500).json({ error: 'Failed to schedule message' });
      }

      res.json({
        success: true,
        message: 'Message scheduled successfully',
        id: this.lastID
      });
    }
  );
});

// Get all scheduled messages
router.get('/scheduled', (req, res) => {
  db.all(
    `SELECT * FROM scheduled_messages 
    WHERE status = 'pending' 
    ORDER BY scheduled_time ASC`,
    (err, rows) => {
      if (err) {
        console.error('Error fetching scheduled messages:', err);
        return res.status(500).json({ error: 'Failed to fetch scheduled messages' });
      }

      res.json({ messages: rows });
    }
  );
});

// Cancel a scheduled message
router.delete('/scheduled/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    "UPDATE scheduled_messages SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
    [id],
    function(err) {
      if (err) {
        console.error('Error cancelling message:', err);
        return res.status(500).json({ error: 'Failed to cancel message' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Scheduled message not found or already sent' });
      }

      res.json({ success: true, message: 'Message cancelled successfully' });
    }
  );
});

export default router;