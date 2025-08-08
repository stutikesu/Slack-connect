import axios from 'axios';
import { db } from '../database/db';
import dotenv from 'dotenv';

dotenv.config();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;

// Interface for token data
interface TokenData {
  id: number;
  workspace_id: string;
  workspace_name: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
}

// Get a valid access token for a workspace
export const getValidToken = async (workspaceId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Get the token from the database
    db.get(
      'SELECT * FROM tokens WHERE workspace_id = ?',
      [workspaceId],
      async (err, row: TokenData) => {
        if (err) {
          console.error('Error fetching token:', err);
          return reject(new Error('Failed to fetch token'));
        }

        if (!row) {
          return reject(new Error('Workspace not connected'));
        }

        const now = Math.floor(Date.now() / 1000);

        // Check if the token is expired or about to expire (within 5 minutes)
        if (row.expires_at <= now + 300) {
          try {
            // Refresh the token
            const newToken = await refreshToken(row.refresh_token, row.workspace_id);
            return resolve(newToken);
          } catch (error) {
            console.error('Error refreshing token:', error);
            return reject(new Error('Failed to refresh token'));
          }
        }

        // Return the existing token if it's still valid
        resolve(row.access_token);
      }
    );
  });
};

// Refresh an expired token
const refreshToken = async (refreshToken: string, workspaceId: string): Promise<string> => {
  try {
    // Call Slack API to refresh the token
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }
    });

    const { ok, access_token, refresh_token, expires_in } = response.data;

    if (!ok) {
      throw new Error('Failed to refresh token');
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expires_in;

    // Update the tokens in the database
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE tokens 
        SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ? 
        WHERE workspace_id = ?`,
        [access_token, refresh_token, expiresAt, now, workspaceId],
        (err) => {
          if (err) {
            console.error('Error updating tokens:', err);
            return reject(new Error('Failed to update tokens'));
          }

          resolve(access_token);
        }
      );
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh token');
  }
};