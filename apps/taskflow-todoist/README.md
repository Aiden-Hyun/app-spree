# TaskFlow - Task Management App

A React Native app built with Expo for organizing tasks, projects, and productivity tracking.

## Tech Stack

- **Expo SDK 55** with React Native 0.74
- **Expo Router v3** for navigation
- **TypeScript** (strict mode)
- **Supabase** for authentication and database
- **React Native StyleSheet** for styling

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project URL and anon key.

3. Start the development server:
   ```bash
   pnpm expo start
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## Features

- **Authentication**: Email/password signup and login
- **Task Management**: Create, edit, and organize tasks
- **Project Organization**: Group tasks into projects
- **Priority System**: Set task priorities (low, medium, high, urgent)
- **Due Dates**: Set and track task deadlines
- **Subtasks**: Break down complex tasks
- **Labels**: Categorize tasks with custom labels
- **Progress Tracking**: Monitor completion streaks and statistics

## Project Structure

```
/app
  - _layout.tsx      # Root layout with auth provider
  - index.tsx        # Entry point with auth routing
  - home.tsx         # Main dashboard
  - login.tsx        # Authentication screen
  - settings.tsx     # User settings

/src
  - components/      # Reusable UI components
  - contexts/        # React contexts (AuthContext)
  - hooks/          # Custom React hooks
  - utils/          # Utility functions
  - supabase.ts     # Supabase client configuration

/supabase
  - schema.sql      # Database schema
```

## Database Schema

- **users**: User accounts and productivity stats
- **projects**: Task organization containers
- **tasks**: Individual task items
- **subtasks**: Task breakdown items
- **task_labels**: Custom categorization labels
- **task_label_assignments**: Many-to-many task-label relationships
