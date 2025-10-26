# NearNow - Planning Document

## Purpose & User Value

NearNow is a location-based social networking app that connects people in close proximity for friendship, networking, and social activities based on shared interests and real-time availability. It emphasizes safety, consent, and meaningful connections by allowing users to discover and chat with nearby individuals who share common goals, whether that's finding workout partners, study buddies, or new friends in a new city. The app prioritizes user privacy and safety with robust verification and reporting systems.

## Core MVP Feature List

- User profiles with interests and bio
- Location-based user discovery (grid view)
- Real-time chat with text and photos
- Distance indicator between users
- Privacy controls (invisible mode, location precision)
- Block and report functionality
- Profile verification system
- Push notifications for messages

## Future / Nice-to-Have Features

- Video chat capabilities
- Group meetups and events
- Interest-based communities
- Ephemeral status updates
- Voice messages
- Advanced filters (interests, availability, etc.)
- Travel mode for planning ahead
- Integration with local venues/events
- Safety features (trusted contacts, check-in)
- Language translation in chat

## Domain Entities & Relationships

- User (id, email, display_name, bio, birth_date, verified)
- Profile (user_id, photos[], interests[], status, last_seen)
- Location (user_id, latitude, longitude, precision_level, updated_at)
- Chat (id, participant_ids[], created_at, last_message_at)
- Message (id, chat_id, sender_id, content, type, read_at)
- Block (blocker_id, blocked_id, reason, created_at)
- Report (reporter_id, reported_id, reason, description, status)
- ProfileView (viewer_id, viewed_id, viewed_at)
- Verification (user_id, type, verified_at, verified_by)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Core Services                │
│  - Nearby Grid          │  - Location Manager           │
│  - Chat List            │  - Realtime Chat              │
│  - Profile              │  - Notification Handler       │
│  - Settings             │  - Safety Features            │
├─────────────────────────────────────────────────────────┤
│         Location Services & Push Notifications           │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - users   │  - photos │  - chat  │  - nearby │
│        │  - location│  - media  │  - status │  - match  │
│        │  - chats   │           │           │  - safety │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/nearnow-grindr/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── verify.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── nearby.tsx
│   │   ├── chats.tsx
│   │   ├── profile.tsx
│   │   └── settings.tsx
│   ├── chat/
│   │   └── [id].tsx
│   ├── user/
│   │   └── [id].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── UserGrid.tsx
│   │   ├── UserCard.tsx
│   │   ├── ChatBubble.tsx
│   │   ├── LocationPermission.tsx
│   │   └── SafetyModal.tsx
│   ├── contexts/
│   │   ├── LocationContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── SafetyContext.tsx
│   ├── hooks/
│   │   ├── useNearbyUsers.ts
│   │   ├── useRealtimeChat.ts
│   │   └── useLocation.ts
│   └── utils/
│       ├── distance.ts
│       ├── safety.ts
│       └── notifications.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── find-nearby.ts
    │   └── report-user.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Discovery & Safety

- Set up Expo project with location permissions
- Implement user authentication and profile creation
- Build location tracking with privacy controls
- Create nearby users grid with distance calculation
- Design safety-first database schema with blocks/reports
- Implement basic user profiles with photos
- Set up profile viewing and basic interactions

### Sprint 2 (Week 2) - Chat & Real-time Features

- Build real-time chat with Supabase Realtime
- Implement push notifications for messages
- Add photo sharing in chat
- Create chat list with unread indicators
- Build comprehensive privacy settings
- Add user verification system
- Implement reporting and blocking flows
- Polish UI with smooth animations

## Key Risks & Mitigations

1. **User Safety and Harassment**

   - Risk: Inappropriate behavior, harassment, or unsafe meetups
   - Mitigation: Robust reporting system, verification, block features, safety guidelines

2. **Location Privacy Concerns**

   - Risk: Exact location exposure leading to stalking
   - Mitigation: Location fuzzing options, grid-based display, invisible mode

3. **Inappropriate Content**

   - Risk: Explicit photos or content violating guidelines
   - Mitigation: Content reporting, image moderation, clear community standards

4. **Scalability of Location Queries**

   - Risk: Performance issues with many users in dense areas
   - Mitigation: Geospatial indexing, smart caching, pagination

5. **Real-time Message Delivery**

   - Risk: Messages delayed or lost, poor chat experience
   - Mitigation: Reliable queue system, delivery receipts, offline support

6. **Age Verification Compliance**
   - Risk: Minors accessing adult-oriented features
   - Mitigation: Strict age verification, app store age ratings, terms of service

## First 3 Actionable Engineering Tasks

1. **Set Up Location Infrastructure**

   - Configure expo-location with permissions
   - Design location privacy levels
   - Create location update system

2. **Build User Discovery System**

   - Implement geospatial queries in Supabase
   - Create nearby users grid component
   - Add distance calculation utilities

3. **Implement Safety Features**
   - Design block and report database schema
   - Create safety-first UI flows
   - Build user verification system
