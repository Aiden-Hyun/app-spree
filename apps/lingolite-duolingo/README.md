# LingoLite - Language Learning App

A React Native app built with Expo for learning languages through interactive lessons and vocabulary practice.

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
- **Multi-language Support**: Learn multiple languages simultaneously
- **Interactive Lessons**: Grammar, vocabulary, and conversation lessons
- **Progress Tracking**: XP system, streaks, and level progression
- **Vocabulary Practice**: Spaced repetition for effective learning
- **Achievement System**: Unlock achievements as you progress

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

- **users**: User profiles and learning stats
- **languages**: Available languages to learn
- **user_languages**: User's language learning progress
- **lessons**: Individual language lessons
- **user_progress**: Lesson completion tracking
- **vocabulary**: Word database with translations
- **user_vocabulary_progress**: Vocabulary mastery tracking