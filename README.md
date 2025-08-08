# Slack Connect

A full-stack application that enables users to connect their Slack workspace, send messages immediately, and schedule messages for future delivery.

## Features

- **Secure Slack Connection & Token Management**
  - OAuth 2.0 flow to connect to a Slack workspace
  - Secure storage of access and refresh tokens
  - Automatic token refresh when old ones expire

- **Message Sending**
  - Send messages immediately to any Slack channel
  - Schedule messages for future delivery

- **Scheduled Message Management**
  - View all scheduled messages
  - Cancel scheduled messages before their send time

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite

## Project Structure

```
├── backend/             # Backend Node.js application
│   ├── src/             # TypeScript source code
│   │   ├── database/    # Database configuration and models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic services
│   │   └── server.ts    # Express server entry point
│   ├── package.json     # Backend dependencies
│   └── tsconfig.json    # TypeScript configuration
├── frontend/            # React frontend application
│   ├── public/          # Static assets
│   ├── src/             # TypeScript source code
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── pages/       # Page components
│   │   └── App.tsx      # Main application component
│   ├── package.json     # Frontend dependencies
│   └── tsconfig.json    # TypeScript configuration
└── package.json         # Root package.json for scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Slack account with permission to create apps

### Slack App Setup

1. Go to [Slack API](https://api.slack.com/apps) and create a new app
2. Under "OAuth & Permissions", add the following scopes:
   - `channels:read`
   - `channels:history`
   - `chat:write`
   - `chat:write.public`
   - `groups:read`
   - `im:read`
   - `mpim:read`
4. Install the app to your workspace
5. Note your Client ID and Client Secret

### Application Setup

1. Clone the repository
2. Create `.env` files in the backend directory (copy from `.env.example`)
3. Add your Slack Client ID and Client Secret to the `.env` file
4. Install dependencies:
   ```
   npm run install:all
   ```
5. Start the development servers:
   ```
   npm run dev
   ```

## Usage

1. Open your browser and navigate to `http://localhost:5173/connect`
2. Click "Connect to Slack" to authorize the application
3. Once connected, you can:
   - Send immediate messages to any channel
   - Schedule messages for future delivery
   - View and manage scheduled messages

## License

ISC
