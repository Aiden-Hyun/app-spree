# CalmNest - Meditation & Mindfulness App

A React Native app built with Expo for meditation, breathing exercises, and sleep stories.

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
- **Meditation Sessions**: Track your meditation practice
- **Breathing Exercises**: Guided breathing techniques
- **Sleep Stories**: Relaxing audio content for better sleep
- **Progress Tracking**: Monitor your meditation streak and total minutes

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

- **users**: User profiles and meditation stats
- **meditation_sessions**: Individual meditation session records
- **meditation_programs**: Structured meditation programs
- **user_program_progress**: User progress through programs