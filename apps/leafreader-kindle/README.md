# LeafReader - Kindle Alternative

A modern React Native app for digital book reading, note-taking, and library management.

## Tech Stack

- **Expo SDK 55** - React Native framework
- **React Native 0.74** - Mobile UI framework
- **Expo Router v3** - File-based routing
- **TypeScript** - Type safety
- **Supabase** - Backend (Auth, Database, Storage)
- **React Native StyleSheet** - Styling

## Features

- 📚 Digital library management
- 📖 Reading progress tracking
- ✨ Highlighting and note-taking
- 🔖 Bookmarking system
- 📊 Reading statistics
- 🌙 Dark mode support
- 🔄 Cross-device sync

## Development Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. Start the development server:
   ```bash
   pnpm expo start
   ```

4. Run tests:
   ```bash
   pnpm test
   ```

## Project Structure

```
/app
  ├── _layout.tsx          # Root layout with auth provider
  ├── index.tsx            # Entry point with auth routing
  ├── home.tsx             # Main dashboard
  ├── login.tsx            # Authentication screen
  └── settings.tsx         # User preferences

/src
  ├── components/          # Reusable UI components
  ├── contexts/           # React contexts (Auth, etc.)
  ├── hooks/              # Custom React hooks
  ├── utils/              # Utility functions
  └── supabase.ts         # Supabase client

/supabase
  └── schema.sql          # Database schema
```

## Database Schema

- **users** - User profiles and preferences
- **books** - Book metadata and reading status
- **reading_sessions** - Individual reading sessions
- **highlights** - Text highlights and notes
- **bookmarks** - Page bookmarks
- **collections** - Custom book collections
- **user_book_progress** - Reading progress tracking

## Key Features

### Authentication
- Email/password signup and login
- Protected routes
- Session management

### Library Management
- Add books to library
- Track reading progress
- Organize books by collections
- Search and filter books

### Reading Experience
- Page-by-page reading
- Highlighting and annotations
- Bookmarking system
- Reading statistics

### Settings
- User preferences
- Reading goals
- Sync settings
- Privacy controls