# RedditMini - Social News App

A React Native app built with Expo for browsing and participating in Reddit-style discussions.

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
- **Subreddits**: Browse and subscribe to communities
- **Posts**: Create and view text, image, and link posts
- **Comments**: Participate in discussions with nested comments
- **Voting**: Upvote and downvote posts and comments
- **User Profiles**: Customize your profile and track karma
- **Search**: Find posts and subreddits
- **Real-time Updates**: Live updates for new posts and comments

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

- **users**: User accounts and profiles
- **subreddits**: Community pages
- **posts**: User-submitted content
- **comments**: Discussion threads
- **votes**: Upvote/downvote tracking
- **subscriptions**: User subreddit subscriptions