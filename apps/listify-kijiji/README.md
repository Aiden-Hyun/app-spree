# Listify - Local Marketplace App

A React Native app built with Expo for buying and selling items locally, similar to Kijiji.

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
- **Item Listings**: Create and manage item listings
- **Category System**: Organize items by categories
- **Location-Based**: Find items near you
- **Messaging**: Contact sellers directly
- **Favorites**: Save items you're interested in
- **Reviews**: Rate and review transactions
- **Image Support**: Upload multiple photos per listing

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

- **users**: User accounts and seller profiles
- **categories**: Item categories and subcategories
- **listings**: Item listings with details and images
- **messages**: Communication between buyers and sellers
- **favorites**: User's saved items
- **reviews**: Transaction reviews and ratings