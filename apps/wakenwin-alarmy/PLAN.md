# WakeNWin - Planning Document

## Purpose & User Value

WakeNWin is a gamified alarm clock app that ensures users actually wake up by requiring them to complete challenges or tasks before the alarm can be dismissed. It helps chronic snoozers and heavy sleepers develop better wake-up habits through engaging mini-games, physical activities, and location-based missions. The app transforms the dreaded morning alarm into an achievement-driven experience that makes waking up feel rewarding rather than painful.

## Core MVP Feature List

- Multiple alarm creation with custom labels
- Challenge-based alarm dismissal (math problems, memory games, shake phone)
- Difficulty levels for challenges (easy, medium, hard)
- Snooze prevention with escalating challenges
- Multiple alarm sounds and custom ringtones
- Wake-up statistics and streak tracking
- Smart alarm within 30-minute window based on sleep cycle
- Emergency override with penalty system

## Future / Nice-to-Have Features

- Location-based dismissal (scan QR code in bathroom)
- Photo challenges (take photo of specific object)
- Voice-based challenges (speak phrase clearly)
- Social accountability (notify friends if you oversleep)
- Sleep tracking integration
- Spotify/Apple Music integration for wake-up songs
- Weather-based alarm adjustments
- Reward points and achievement system
- Multiplayer wake-up challenges
- Smart home integration (turn on lights)

## Domain Entities & Relationships

- User (id, email, username, wake_score, total_points)
- Alarm (id, user_id, time, days_of_week[], label, is_active, challenge_type, difficulty)
- Challenge (id, type, difficulty, instructions, validation_rules)
- AlarmInstance (id, alarm_id, scheduled_time, completed_time, challenge_result)
- WakeStreak (user_id, current_streak, longest_streak, last_wake_date)
- Achievement (id, name, description, points_value, icon)
- UserAchievement (user_id, achievement_id, earned_at)
- AlarmSound (id, name, file_url, is_premium)
- EmergencyOverride (user_id, alarm_instance_id, penalty_points, reason)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Core Systems                 │
│  - Alarms List          │  - Notification Manager       │
│  - Challenge Screen     │  - Challenge Engine           │
│  - Statistics           │  - Sound Player               │
│  - Settings             │  - Background Tasks           │
├─────────────────────────────────────────────────────────┤
│         Native Modules (Notifications, Audio)            │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - alarms  │  - sounds │ - social │  - stats  │
│        │  - history │  - photos │          │  - leader │
│        │  - streaks │           │          │           │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/wakenwin-alarmy/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── alarms.tsx
│   │   ├── stats.tsx
│   │   └── achievements.tsx
│   ├── alarm/
│   │   ├── new.tsx
│   │   └── [id]/
│   │       └── edit.tsx
│   ├── challenge/
│   │   └── [type].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── AlarmCard.tsx
│   │   ├── ChallengeGame.tsx
│   │   ├── StreakCounter.tsx
│   │   └── TimePicker.tsx
│   ├── contexts/
│   │   ├── AlarmContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── GameContext.tsx
│   ├── hooks/
│   │   ├── useAlarms.ts
│   │   ├── useNotifications.ts
│   │   └── useBackgroundTask.ts
│   └── utils/
│       ├── challenges.ts
│       ├── notifications.ts
│       └── audio.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   └── calculate-stats.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Alarm Functionality

- Set up Expo project with notification permissions
- Implement alarm CRUD operations with time picker
- Create local notification scheduling system
- Build basic math problem challenge
- Implement alarm sound player with volume control
- Create alarm list screen with enable/disable
- Set up recurring alarms for specific days

### Sprint 2 (Week 2) - Challenges & Gamification

- Add shake-to-dismiss challenge with accelerometer
- Implement memory game challenge
- Build streak tracking system
- Create statistics dashboard
- Add multiple difficulty levels
- Implement emergency override with penalties
- Create achievement system
- Polish UI with animations and haptic feedback

## Key Risks & Mitigations

1. **Background Execution Limitations**

   - Risk: iOS/Android killing app, preventing alarm from firing
   - Mitigation: Use system notifications, implement foreground service for Android

2. **Challenge Bypass/Cheating**

   - Risk: Users finding ways to dismiss without completing challenges
   - Mitigation: Multiple validation checks, randomized challenges, penalty system

3. **Battery Drain Concerns**

   - Risk: Background monitoring and sensors draining battery
   - Mitigation: Optimize background tasks, clear battery usage warnings

4. **Notification Permissions**

   - Risk: Users denying permissions, alarms not working
   - Mitigation: Clear onboarding explaining necessity, in-app permission prompts

5. **Audio Interruption Handling**

   - Risk: Other apps or calls interrupting alarm sound
   - Mitigation: Audio focus management, persistent notification

6. **Time Zone Handling**
   - Risk: Alarms firing at wrong times when traveling
   - Mitigation: Proper timezone handling, location-based adjustments

## First 3 Actionable Engineering Tasks

1. **Set Up Notification Infrastructure**

   - Configure expo-notifications
   - Implement permission request flow
   - Create notification scheduling utilities

2. **Build Alarm Data Model**

   - Design Supabase schema for alarms and instances
   - Create local storage for offline reliability
   - Implement alarm CRUD operations

3. **Create Basic Challenge System**
   - Build math problem generator and validator
   - Design challenge screen UI
   - Implement challenge completion flow
