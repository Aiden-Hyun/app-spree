# SafePocket - Password Manager App

A React Native app built with Expo for secure password management and storage.

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
- **Password Vault**: Store and manage passwords securely
- **Categories**: Organize passwords by categories
- **Password Generator**: Create strong, unique passwords
- **Biometric Security**: Fingerprint/Face ID authentication
- **Auto Lock**: Automatic vault locking for security
- **Password History**: Track password changes over time
- **Security Events**: Monitor account security activities
- **Shared Passwords**: Share passwords with family/team members

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

- **users**: User accounts and security settings
- **password_categories**: Password organization categories
- **passwords**: Encrypted password storage
- **password_history**: Password change tracking
- **security_events**: Security activity logging
- **shared_passwords**: Password sharing functionality