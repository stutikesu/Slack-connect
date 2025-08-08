Slack Connect
A full-stack application that enables users to connect their Slack workspace, send messages immediately, and schedule messages for future delivery.

Features
Secure Slack Connection & Token Management

OAuth 2.0 flow to connect to a Slack workspace

Secure storage of access and refresh tokens

Automatic token refresh when tokens expire

Message Sending

Send messages immediately to any Slack channel

Schedule messages for future delivery

Scheduled Message Management

View all scheduled messages

Cancel scheduled messages before their send time

Technology Stack
Frontend: React, TypeScript, Vite

Backend: Node.js, Express, TypeScript

Database: SQLite

Project Structure
php
Copy
Edit
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
Setup Instructions
Prerequisites
Node.js (v14 or higher)

npm or yarn

A Slack account with permission to create apps

Slack App Setup
Go to Slack API and create a new app.

Under OAuth & Permissions, add these scopes:
channels:read, channels:history, chat:write, chat:write.public, groups:read, im:read, mpim:read

Install the app to your workspace.

Note your Client ID and Client Secret.

Application Setup
Clone the repository:

bash
Copy
Edit
git clone https://github.com/yourusername/your-repo-name.git
cd your-repo-name
Create .env files in the backend directory (copy from .env.example):

bash
Copy
Edit
cp backend/.env.example backend/.env
Add your Slack Client ID and Client Secret to backend/.env.

Install dependencies for both frontend and backend:

bash
Copy
Edit
npm run install:all
Start the development servers:

bash
Copy
Edit
npm run dev
Open your browser and go to http://localhost:5173/connect

Usage
Click Connect to Slack to authorize the application.

After connecting, you can:

Send immediate messages to any channel.

Schedule messages for future delivery.

View and manage scheduled messages.

Architectural Overview
OAuth 2.0 Flow: The app uses Slack OAuth to securely authorize user workspaces and get access and refresh tokens.

Token Management: Access and refresh tokens are securely stored in SQLite. The backend refreshes expired tokens automatically before making Slack API calls.

Scheduled Task Handling: Scheduled messages are stored with timestamps. A backend scheduler processes and sends messages at the right time.

Challenges & Learnings
Implementing a robust OAuth 2.0 flow with refresh tokens was complex but essential for seamless user experience.

Managing scheduled messages reliably required careful handling of time zones and server cron jobs.

Ensuring secure storage and refresh of tokens taught valuable lessons in security best practices.

License
ISC

