# WakeNWin - Alarm & Challenge App

A React Native app built with Expo for setting alarms with challenges to help you wake up and start your day right.

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
- **Smart Alarms**: Set alarms with customizable wake-up challenges
- **Challenge Types**: Math problems, shake challenges, photo verification
- **Progress Tracking**: Monitor your wake-up streak and success rate
- **Mood Tracking**: Rate your morning mood after waking up

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

- **users**: User profiles and wake-up stats
- **alarms**: Alarm configurations and settings
- **challenges**: Individual wake-up challenges
- **wake_up_sessions**: Daily wake-up session records
