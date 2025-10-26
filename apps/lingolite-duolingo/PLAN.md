# LingoLite - Planning Document

## Purpose & User Value

LingoLite is a gamified language learning app that makes acquiring new languages fun and addictive through bite-sized lessons, interactive exercises, and a rewarding progression system. It uses spaced repetition, contextual learning, and immediate feedback to help users build practical language skills they can use in real conversations. The app turns language learning from a chore into a daily habit by combining educational science with game design principles.

## Core MVP Feature List

- Multi-language course selection (start with 3 languages)
- Lesson tree with clear progression path
- Interactive exercise types (translation, listening, speaking, matching)
- XP points and streak system
- Daily goal setting and reminders
- Progress tracking with skill levels
- Offline lesson downloads
- Basic achievement badges

## Future / Nice-to-Have Features

- AI-powered conversation practice
- Live tutoring sessions
- Story mode with contextual learning
- Leaderboards and leagues
- Friend challenges and social features
- Grammar tips and conjugation tables
- Pronunciation analysis with voice recognition
- Custom vocabulary lists
- Language exchange matching
- Podcast and video content integration

## Domain Entities & Relationships

- User (id, email, username, native_language, xp_total, gems)
- Course (id, language_code, language_name, flag_emoji, total_skills)
- UserCourse (user_id, course_id, current_skill, xp_earned)
- Skill (id, course_id, name, order_index, total_lessons)
- Lesson (id, skill_id, lesson_number, xp_value)
- Exercise (id, lesson_id, type, question_data, answer_data)
- UserProgress (user_id, lesson_id, completed_at, accuracy, xp_earned)
- Streak (user_id, current_streak, longest_streak, last_practice_date)
- Achievement (id, name, description, criteria, icon_url)
- DailyGoal (user_id, target_xp, current_xp, date)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Learning Engine              │
│  - Course Selection     │  - Exercise Generator         │
│  - Lesson Tree          │  - Spaced Repetition         │
│  - Practice Session     │  - Progress Tracker           │
│  - Profile              │  - Audio Player               │
├─────────────────────────────────────────────────────────┤
│           Speech Recognition & Audio APIs                │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - courses │  - audio  │ - league │  - review │
│        │  - lessons │  - images │          │  - match  │
│        │  - progress│           │          │           │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/lingolite-duolingo/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── onboarding.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── learn.tsx
│   │   ├── practice.tsx
│   │   ├── leaderboard.tsx
│   │   └── profile.tsx
│   ├── lesson/
│   │   └── [id].tsx
│   ├── course/
│   │   └── select.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── ExerciseCard.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── SkillTree.tsx
│   │   └── AudioButton.tsx
│   ├── contexts/
│   │   ├── CourseContext.tsx
│   │   ├── LearningContext.tsx
│   │   └── AudioContext.tsx
│   ├── hooks/
│   │   ├── useLessons.ts
│   │   ├── useStreak.ts
│   │   └── useSpeechRecognition.ts
│   └── utils/
│       ├── exercises.ts
│       ├── spaced-repetition.ts
│       └── audio.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── generate-review.ts
    │   └── calculate-league.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Learning Loop

- Set up Expo project with TypeScript and audio capabilities
- Design database schema for courses, lessons, and exercises
- Create course selection and onboarding flow
- Build lesson tree UI with locked/unlocked skills
- Implement core exercise types (translation, multiple choice)
- Create lesson completion flow with XP rewards
- Set up basic progress tracking

### Sprint 2 (Week 2) - Engagement Features

- Add audio exercises with playback controls
- Implement streak system with notifications
- Build user profile with statistics
- Add daily goal setting and tracking
- Create achievement system with badges
- Implement offline lesson caching
- Add spaced repetition algorithm
- Polish UI with animations and sounds

## Key Risks & Mitigations

1. **Content Creation Scalability**

   - Risk: Manually creating quality lessons for multiple languages
   - Mitigation: Start with 3 languages, build content creation tools, consider partnerships

2. **Speech Recognition Accuracy**

   - Risk: Poor recognition frustrating users, especially for accents
   - Mitigation: Start with optional speaking exercises, use quality APIs, provide skip option

3. **Offline Functionality Complexity**

   - Risk: Syncing issues between offline and online progress
   - Mitigation: Clear offline indicators, robust conflict resolution, limit offline content

4. **User Retention Challenges**

   - Risk: Users losing motivation after initial enthusiasm
   - Mitigation: Strong streak system, varied content, social features, personalized goals

5. **Audio File Storage Costs**

   - Risk: Large audio files for lessons expensive to store/serve
   - Mitigation: Compress audio, use CDN, implement smart caching, consider generated speech

6. **Exercise Variety Balance**
   - Risk: Exercises becoming repetitive and boring
   - Mitigation: Multiple exercise types, randomization, contextual variations

## First 3 Actionable Engineering Tasks

1. **Set Up Course and Lesson Structure**

   - Design Supabase schema for courses, skills, lessons
   - Create seed data for one complete language course
   - Build course selection screen

2. **Implement Core Exercise Engine**

   - Create exercise component architecture
   - Build translation exercise type
   - Implement answer validation and feedback

3. **Build Progress Tracking System**
   - Create progress storage and retrieval
   - Implement XP calculation logic
   - Design progress UI components
