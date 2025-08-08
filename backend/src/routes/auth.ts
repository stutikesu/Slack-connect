import express from 'express';
import axios from 'axios';
import { db } from '../database/db';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Slack OAuth credentials from environment variables
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI;

// Scopes required for the Slack app
const SLACK_SCOPES = [
  'channels:read',
  'channels:history',
  'chat:write',
  'chat:write.public',
  'groups:read',
  'im:read',
  'mpim:read'
].join(',');

/**
 * @route GET /slack
 * @desc Initiates Slack OAuth flow
 */
router.get('/slack', (req, res) => {
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${SLACK_SCOPES}&redirect_uri=${SLACK_REDIRECT_URI}`;
  res.redirect(authUrl);
});

/**
 * @route GET /api/auth/slack/callback
 * @desc Handles Slack OAuth callback
 */
router.get('/slack/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).json({ error: 'OAuth authorization denied' });
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange authorization code for tokens
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI
      }
    });

    // Extract data from response, ensuring refresh_token is properly handled
    const { ok, access_token, team } = response.data;
    // Some Slack apps don't receive refresh tokens, so we need to handle this case
    const refresh_token = response.data.refresh_token;

    if (!ok) {
      return res.status(400).json({ error: 'Failed to exchange authorization code for tokens' });
    }

    // Log the response data for debugging
    console.log('Slack OAuth response:', JSON.stringify(response.data, null, 2));

    const now = Math.floor(Date.now() / 1000);
    // Default expiration to 1 year if not provided
    const expiresAt = now + (response.data.expires_in || 31536000);
    
    // Handle case when refresh_token is not provided
    const refreshToken = refresh_token || null;

    // Save tokens in DB - including refresh_token field which can be NULL
    db.run(
      `INSERT OR REPLACE INTO tokens 
       (workspace_id, workspace_name, access_token, refresh_token, expires_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        team.id,
        team.name,
        access_token,
        refreshToken,  // This can be null
        expiresAt,
        now,
        now
      ],
      (err) => {
        if (err) {
          console.error('Error storing tokens:', err);
          return res.status(500).json({ error: 'Failed to store tokens' });
        }

        // Redirect back to frontend with success status
        res.redirect(`${process.env.FRONTEND_URL || '/'}?connected=true&workspace=${encodeURIComponent(team.name)}`);
      }
    );
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ error: 'OAuth process failed' });
  }
});

/**
 * @route GET /workspaces
 * @desc Returns connected workspaces
 */
router.get('/workspaces', (req, res) => {
  db.all('SELECT workspace_id, workspace_name FROM tokens', (err, rows) => {
    if (err) {
      console.error('Error fetching workspaces:', err);
      return res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
    res.json({ workspaces: rows });
  });
});

/**
 * @route DELETE /workspace/:id
 * @desc Disconnects a workspace
 */
router.delete('/workspace/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tokens WHERE workspace_id = ?', [id], function (err) {
    if (err) {
      console.error('Error disconnecting workspace:', err);
      return res.status(500).json({ error: 'Failed to disconnect workspace' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    res.json({ success: true, message: 'Workspace disconnected successfully' });
  });
});

export default router;
