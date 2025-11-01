# NearNow - Location-Based Social App

A React Native app built with Expo for connecting with people nearby through location-based matching, similar to Grindr.

## Tech Stack

- **Expo SDK 51** with React Native 0.74
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

3. Create Supabase Storage buckets:

   - Go to your Supabase dashboard
   - Navigate to Storage
   - Create a new bucket called `profile-photos` with public access
   - Create a new bucket called `chat-images` with public access

4. Start the development server:
   ```bash
   pnpm expo start
   ```

## Current Implementation Status

### ✅ Completed Features

1. **Authentication System**

   - Email/password signup and login
   - Protected routes
   - Session management

2. **Location Services**

   - Real-time GPS tracking
   - Background location updates
   - Permission handling
   - Distance calculations between users

3. **Onboarding Flow**

   - Welcome screen
   - Permission requests (location, camera, photos, notifications)
   - Profile setup (name, age, bio, interests, looking for)
   - Photo upload (up to 6 photos)

4. **Tab Navigation**

   - Discover: Grid view of nearby users
   - Chats: List of active conversations
   - Favorites: Starred profiles
   - Profile: User's own profile and settings

5. **User Discovery**

   - Grid layout showing nearby users
   - Distance display
   - Online/offline status
   - Real-time updates

6. **User Profiles**
   - Detailed profile viewing
   - Photo gallery
   - Bio and interests
   - Action buttons (Tap, Favorite, Chat, Block)

### ✅ Additional Completed Features

7. **Matching System**

   - Tap/like functionality with swipe tracking
   - Mutual match detection
   - Match notifications when both users like each other
   - Stats tracking (taps received, matches, favorites)

8. **Real-time Chat**

   - Text messaging with Supabase Realtime
   - Photo sharing with image upload
   - Location sharing
   - Read receipts
   - Typing indicators
   - Message history with pagination
   - Push notifications for new messages

9. **Push Notifications**

   - Expo notifications setup
   - Local notifications for matches and messages
   - Push token management
   - Notification handlers for navigation

10. **Online Presence**

    - Real-time online/offline status
    - Last seen timestamps
    - Background status updates
    - Presence channel subscriptions

11. **Privacy Controls**
    - Profile visibility settings (everyone/matches only/hidden)
    - Show/hide distance, age, and online status
    - Incognito mode for invisible browsing
    - Block/unblock users functionality
    - Screenshot permissions
    - Profile editing with privacy preferences

## Project Structure

```
/app
  ├── _layout.tsx           # Root layout with auth provider
  ├── index.tsx            # Entry point with auth routing
  ├── home.tsx             # Onboarding check & redirect
  ├── login.tsx            # Authentication screen
  ├── settings.tsx         # User settings
  ├── (tabs)/              # Tab navigation
  │   ├── _layout.tsx      # Tab layout
  │   ├── discover.tsx     # Grid of nearby users
  │   ├── chats.tsx        # Chat conversations
  │   ├── favorites.tsx    # Favorite profiles
  │   └── profile.tsx      # User's profile
  ├── onboarding/          # Onboarding flow
  │   ├── welcome.tsx      # Welcome screen
  │   ├── permissions.tsx  # Permission requests
  │   ├── profile-setup.tsx # Profile creation
  │   └── photo-upload.tsx # Photo upload
  ├── user/[id].tsx        # User profile view
  └── chat/[id].tsx        # Chat screen (pending)

/src
  ├── components/
  │   ├── LocationPermission.tsx
  │   ├── ProtectedRoute.tsx
  │   └── UserCard.tsx
  ├── contexts/
  │   └── AuthContext.tsx
  ├── hooks/
  │   ├── useLocation.ts
  │   ├── useNearbyUsers.ts
  │   ├── useProfile.ts
  │   ├── useChats.ts
  │   └── useFavorites.ts
  ├── services/
  │   ├── locationService.ts
  │   └── photoService.ts
  ├── utils/
  │   ├── distance.ts
  │   ├── permissions.ts
  │   └── time.ts
  └── supabase.ts

/supabase
  └── schema.sql           # Database schema
```

## Database Schema

- **users**: User accounts with location data, online status, and preferences
- **user_profiles**: Extended profile information (photos, interests, looking for)
- **matches**: User match relationships with active status
- **messages**: Chat messages between matches with read receipts
- **swipes**: User interactions (like, pass, super_like)
- **push_tokens**: Device push notification tokens
- **blocked_users**: User blocking relationships for privacy

## Key Implementation Details

1. **Location Privacy**: User locations are never exposed exactly - fuzzy location options available
2. **Real-time Updates**: Using Supabase Realtime for live user status and chat
3. **Background Tasks**: Location updates continue when app is backgrounded
4. **Image Optimization**: Photos are compressed and stored in Supabase Storage
5. **Permission Handling**: Graceful fallbacks when permissions are denied
