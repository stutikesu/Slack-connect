import cron from 'node-cron';
import axios from 'axios';
import { db } from '../database/db';
import { getValidToken } from './token';

// Interface for scheduled message
interface ScheduledMessage {
  id: number;
  workspace_id: string;
  channel_id: string;
  message: string;
  scheduled_time: number;
  status: string;
}

// Initialize the scheduler
export const initializeScheduler = (): void => {
  console.log('Initializing message scheduler');

  // Run the scheduler every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledMessages();
    } catch (error) {
      console.error('Error processing scheduled messages:', error);
    }
  });
};

// Process scheduled messages that are due
const processScheduledMessages = async (): Promise<void> => {
  const now = Math.floor(Date.now() / 1000);

  return new Promise((resolve, reject) => {
    // Get all pending messages that are due
    db.all(
      `SELECT * FROM scheduled_messages 
      WHERE status = 'pending' AND scheduled_time <= ?`,
      [now],
      async (err, rows: ScheduledMessage[]) => {
        if (err) {
          console.error('Error fetching due messages:', err);
          return reject(err);
        }

        if (rows.length === 0) {
          return resolve();
        }

        console.log(`Found ${rows.length} messages to send`);

        // Process each message
        for (const message of rows) {
          try {
            await sendScheduledMessage(message);
            
            // Update the message status to sent
            db.run(
              "UPDATE scheduled_messages SET status = 'sent' WHERE id = ?",
              [message.id],
              (err) => {
                if (err) {
                  console.error(`Error updating message ${message.id} status:`, err);
                }
              }
            );
          } catch (error) {
            console.error(`Error sending scheduled message ${message.id}:`, error);
            
            // Update the message status to failed
            db.run(
              "UPDATE scheduled_messages SET status = 'failed' WHERE id = ?",
              [message.id],
              (err) => {
                if (err) {
                  console.error(`Error updating message ${message.id} status:`, err);
                }
              }
            );
          }
        }

        resolve();
      }
    );
  });
};

// Send a scheduled message
const sendScheduledMessage = async (message: ScheduledMessage): Promise<void> => {
  try {
    // Get a valid token for the workspace
    const token = await getValidToken(message.workspace_id);

    // Call Slack API to send the message
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: message.channel_id,
        text: message.message
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
      throw new Error(`Slack API error: ${error}`);
    }

    console.log(`Successfully sent scheduled message ${message.id}`);
  } catch (error) {
    console.error(`Error sending scheduled message ${message.id}:`, error);
    throw error;
  }
};