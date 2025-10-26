# RedditMini - Planning Document

## Purpose & User Value

RedditMini is a community-driven social platform that enables users to discover, discuss, and share content across thousands of topic-based communities, fostering meaningful conversations and connections around shared interests. It democratizes content through voting systems while maintaining community standards through moderation tools. The app brings the best of Reddit's community experience to mobile with a clean, fast interface that makes browsing, posting, and engaging with communities intuitive and enjoyable.

## Core MVP Feature List

- User registration and profiles
- Subreddit creation and subscription
- Post creation (text, link, image)
- Upvote/downvote system
- Nested comment threads
- Hot/New/Top sorting algorithms
- Search posts and subreddits
- Save posts and comments

## Future / Nice-to-Have Features

- Live chat and chat rooms
- Reddit Gold/Awards system
- Moderator tools and AutoMod
- Multireddit collections
- User flair and post flair
- Rich text editor with markdown
- Polls and live threads
- Private messaging
- Content filtering and blocking
- Cross-posting between subreddits

## Domain Entities & Relationships

- User (id, username, email, karma_post, karma_comment, created_at)
- Subreddit (id, name, title, description, creator_id, subscriber_count)
- Subscription (user_id, subreddit_id, joined_at)
- Post (id, subreddit_id, author_id, title, content, type, score, created_at)
- Comment (id, post_id, parent_id, author_id, content, score, created_at)
- Vote (user_id, voteable_id, voteable_type, value)
- SavedItem (user_id, item_id, item_type, saved_at)
- Moderator (subreddit_id, user_id, permissions, added_at)
- Report (reporter_id, content_id, content_type, reason, status)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Core Systems                 │
│  - Home Feed            │  - Voting Engine              │
│  - Subreddit View       │  - Comment Threading          │
│  - Post Detail          │  - Feed Algorithm             │
│  - User Profile         │  - Search Engine              │
├─────────────────────────────────────────────────────────┤
│           Media Upload & Caching Services                │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - posts   │  - images │  - votes │  - feed   │
│        │  - comments│  - videos │  - chat  │  - karma  │
│        │  - votes   │           │           │  - hot    │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/redditmini-reddit/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── popular.tsx
│   │   ├── create.tsx
│   │   └── profile.tsx
│   ├── r/
│   │   ├── [subreddit]/
│   │   │   ├── index.tsx
│   │   │   └── submit.tsx
│   │   └── create.tsx
│   ├── post/
│   │   └── [id].tsx
│   ├── u/
│   │   └── [username].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── PostCard.tsx
│   │   ├── CommentThread.tsx
│   │   ├── VoteButtons.tsx
│   │   ├── SubredditHeader.tsx
│   │   └── MediaViewer.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   ├── FeedContext.tsx
│   │   └── VoteContext.tsx
│   ├── hooks/
│   │   ├── useFeed.ts
│   │   ├── useVoting.ts
│   │   └── useComments.ts
│   └── utils/
│       ├── feed-algorithm.ts
│       ├── karma-calculator.ts
│       └── markdown.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── calculate-hot.ts
    │   └── update-karma.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Reddit Experience

- Set up Expo project with authentication
- Design database schema for posts, comments, votes
- Create subreddit system with subscriptions
- Build home feed with hot/new/top sorting
- Implement post creation (text and link)
- Add voting system with score calculation
- Create post detail view with comments
- Implement basic comment threading

### Sprint 2 (Week 2) - Community Features

- Add image post support with uploads
- Build user profiles with karma display
- Implement search for posts and subreddits
- Create subreddit discovery page
- Add save functionality for posts/comments
- Build comment reply system
- Implement feed algorithm optimization
- Polish UI with smooth animations

## Key Risks & Mitigations

1. **Content Moderation at Scale**

   - Risk: Spam, hate speech, illegal content
   - Mitigation: Report system, moderator tools, content filters, community guidelines

2. **Vote Manipulation**

   - Risk: Bot armies, brigading, karma farming
   - Mitigation: Rate limiting, vote fuzzing, suspicious activity detection

3. **Performance with Nested Comments**

   - Risk: Deep comment threads causing UI lag
   - Mitigation: Pagination, lazy loading, comment collapsing

4. **Feed Algorithm Complexity**

   - Risk: Poor content discovery, echo chambers
   - Mitigation: Multiple algorithms, personalization options, diverse defaults

5. **Storage Costs for Media**

   - Risk: High costs for image/video hosting
   - Mitigation: Compression, CDN caching, size limits, lazy deletion

6. **Real-time Updates Scale**
   - Risk: Websocket overload on popular posts
   - Mitigation: Selective real-time, polling fallback, connection pooling

## First 3 Actionable Engineering Tasks

1. **Design Community Structure**

   - Create database schema for subreddits, posts, comments
   - Implement subscription system
   - Build subreddit creation flow

2. **Implement Voting System**

   - Create vote tracking with deduplication
   - Build score calculation algorithms
   - Design upvote/downvote UI components

3. **Build Feed Generation**
   - Implement hot/new/top sorting algorithms
   - Create paginated feed queries
   - Build feed UI with infinite scroll
