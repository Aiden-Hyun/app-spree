# CalmNest - Planning Document

## Purpose & User Value

CalmNest is a meditation and mindfulness app that helps users reduce stress, improve focus, and build healthy mental habits through guided meditations, breathing exercises, and sleep stories. It provides personalized meditation journeys based on user goals and tracks progress to encourage consistent practice. The app aims to make mindfulness accessible and engaging for beginners while offering depth for experienced practitioners.

## Core MVP Feature List

- User authentication and profile setup
- Guided meditation library with categories (stress, sleep, focus, anxiety)
- Basic meditation player with timer and background sounds
- Breathing exercise animations (box breathing, 4-7-8 technique)
- Daily meditation reminders and streak tracking
- Favorites and meditation history
- Offline download for selected content

## Future / Nice-to-Have Features

- Sleep stories and soundscapes
- Live group meditation sessions
- AI-powered meditation recommendations
- Mood tracking and insights
- Integration with health apps (Apple Health, Google Fit)
- Custom meditation creation tools
- Social features (meditation buddies, challenges)
- Premium content tiers
- Wearable device integration

## Domain Entities & Relationships

- User (id, email, name, subscription_tier, created_at)
- Profile (user_id, goals[], experience_level, preferred_duration)
- Meditation (id, title, description, duration, category, audio_url, instructor_id)
- Category (id, name, icon, display_order)
- Session (id, user_id, meditation_id, completed_at, duration_listened)
- Streak (user_id, current_streak, longest_streak, last_session_date)
- Favorite (user_id, meditation_id, created_at)
- Download (user_id, meditation_id, file_path, downloaded_at)
- Reminder (user_id, time, days_of_week[], is_active)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Business Logic (Contexts)    │
│  - Home                 │  - AuthContext                │
│  - Explore              │  - MeditationContext          │
│  - Player               │  - StreakContext              │
│  - Profile              │  - DownloadContext            │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │  Realtime  │  Edge Fn │
│        │  - users   │  - audio  │  - groups  │  - recs  │
│        │  - medits  │  - images │            │  - stats │
│        │  - sessions│           │            │          │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/calmnest-headspace/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── explore.tsx
│   │   ├── profile.tsx
│   │   └── progress.tsx
│   ├── meditation/
│   │   └── [id].tsx
│   ├── player.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── MeditationCard.tsx
│   │   ├── CategoryGrid.tsx
│   │   ├── StreakDisplay.tsx
│   │   └── AudioPlayer.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── MeditationContext.tsx
│   │   └── PlayerContext.tsx
│   ├── hooks/
│   │   ├── useMeditations.ts
│   │   ├── useStreak.ts
│   │   └── useDownloads.ts
│   └── utils/
│       ├── supabase.ts
│       └── audio.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   └── get-recommendations.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Foundation & Core Features

- Set up Expo project with TypeScript and Supabase integration
- Implement authentication flow (login, register, password reset)
- Create database schema for users, meditations, and sessions
- Build home screen with featured meditations
- Develop basic audio player with play/pause/progress
- Implement meditation categories and explore screen
- Set up basic navigation with Expo Router

### Sprint 2 (Week 2) - Engagement & Polish

- Add user profile screen with settings
- Implement streak tracking and display
- Build favorites functionality
- Add meditation history tracking
- Create daily reminder notifications
- Implement offline downloads for meditations
- Polish UI/UX and add loading states
- Add basic analytics tracking

## Key Risks & Mitigations

1. **Audio Streaming Performance**

   - Risk: Poor network conditions causing buffering issues
   - Mitigation: Implement progressive download, quality adaptation, and robust offline mode

2. **Content Licensing & Storage Costs**

   - Risk: High costs for storing/streaming meditation audio
   - Mitigation: Use Supabase Storage with CDN, implement smart caching, consider user limits

3. **User Retention & Engagement**

   - Risk: Users abandoning app after initial use
   - Mitigation: Strong onboarding, personalized recommendations, streak gamification

4. **Background Audio Playback**

   - Risk: Complex implementation across iOS/Android
   - Mitigation: Use expo-av with proper background mode configuration, thorough testing

5. **Scalability of Realtime Features**

   - Risk: Group meditation sessions overwhelming Realtime connections
   - Mitigation: Implement room limits, use Edge Functions for coordination

6. **Data Privacy & Mental Health Sensitivity**
   - Risk: Mishandling sensitive user data
   - Mitigation: Implement strong encryption, minimal data collection, clear privacy policy

## First 3 Actionable Engineering Tasks

1. **Initialize Expo Project & Setup**

   - Create new Expo app with TypeScript template
   - Configure Expo Router v3 with tab navigation
   - Set up Supabase client and environment variables

2. **Design & Implement Database Schema**

   - Create Supabase tables for users, meditations, sessions
   - Set up Row Level Security policies
   - Create initial seed data for testing

3. **Build Authentication Flow**
   - Implement login/register screens with form validation
   - Set up AuthContext with Supabase Auth
   - Create protected route wrapper for authenticated screens
