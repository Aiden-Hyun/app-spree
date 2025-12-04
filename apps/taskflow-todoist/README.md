# TaskFlow - Todoist-like Task Management App

A powerful task management app built with React Native and Expo, inspired by Todoist. Organize your life with projects, smart task organization, and productivity insights.

## 🚀 Features

### Core Task Management

- **Smart Views**: Inbox, Today, Upcoming views for task organization
- **Projects**: Group tasks into color-coded projects
- **Priority System**: 4-level priority system (Low, Medium, High, Urgent)
- **Due Dates**: Set deadlines with overdue handling
- **Task Completion**: Toggle tasks with visual feedback
- **Quick Add**: Fast task creation with project and date presets

### Organization & Filtering

- **Project Management**: Create, edit, and archive projects
- **Smart Filtering**: Filter by status, priority, project, or search terms
- **Task Grouping**: Automatic grouping by date, priority, or project
- **Subtasks**: Break down complex tasks into smaller steps
- **Labels**: Tag tasks with custom labels for cross-project organization

### Productivity & Analytics

- **Productivity Stats**: Track completion rates and patterns
- **Streak Tracking**: Current and longest streak monitoring
- **Task Analytics**: View tasks by project, priority, and time
- **Productivity Insights**: Discover your most productive days and hours
- **Progress Visualization**: See task completion trends over time

## 📱 Screenshots

The app features:

- Tab navigation with Inbox, Today, Upcoming, and Projects views
- Clean, modern UI with purple accent color (#6c5ce7)
- Swipeable task items (future feature)
- Floating action button for quick task creation
- Modal-based task creation with rich options

## 🛠 Tech Stack

- **Expo SDK 51** with React Native 0.74
- **Expo Router v3** for file-based navigation
- **TypeScript** with strict mode
- **Supabase** for backend (Auth, Database, RLS)
- **React Native StyleSheet** for styling
- **@expo/vector-icons** for iconography

## 📦 Project Structure

```
/app
  - _layout.tsx           # Root navigation stack
  - (tabs)/              # Tab navigation
    - inbox.tsx          # All unassigned tasks
    - today.tsx          # Tasks due today
    - upcoming.tsx       # Next 7 days view
    - projects.tsx       # Project management
  - quick-add.tsx        # Task creation modal
  - stats.tsx            # Productivity analytics
  - login.tsx            # Authentication
  - settings.tsx         # User preferences

/src
  - components/          # UI Components
    - TaskItem.tsx       # Individual task display
    - TaskList.tsx       # Task list with grouping
    - ProjectCard.tsx    # Project summary card
    - QuickAddModal.tsx  # Task creation modal
    - EmptyState.tsx     # Empty view component
  - services/            # Business Logic
    - taskService.ts     # Task CRUD operations
    - projectService.ts  # Project management
    - statsService.ts    # Analytics queries
  - hooks/               # Custom Hooks
    - useTasks.ts        # Task state management
    - useProjects.ts     # Project operations
    - useTaskFilters.ts  # Smart filtering logic
  - contexts/            # React Contexts
    - AuthContext.tsx    # Authentication state

/supabase
  - schema.sql          # Database schema
  - seed.sql            # Sample data
```

## 🚀 Getting Started

### Quick Start

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Set up environment**:

   Create a `.env` file in this directory:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   EXPO_PUBLIC_ENV=development
   ```

3. **Set up Supabase**:

   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run `supabase/schema.sql` in the SQL editor
   - Copy credentials to `.env`

4. **Start development**:

   ```bash
   pnpm expo start
   ```

### 📱 Building for Production

See **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** for complete instructions on:
- Creating app assets (icons, splash screens)
- Building with EAS
- Play Store submission
- Privacy policy requirements
- Post-launch checklist

## 📊 Database Schema

### Core Tables

- **users**: User profiles with productivity stats
- **projects**: Task containers with colors and descriptions
- **tasks**: Main task records with all metadata
- **subtasks**: Checklist items within tasks
- **task_labels**: User-defined tags
- **task_label_assignments**: Many-to-many relationships

### Row Level Security

All tables have RLS enabled, ensuring users can only access their own data.

## 🔮 Future Enhancements

- [ ] Swipe gestures for quick actions
- [ ] Natural language task input
- [ ] Recurring tasks
- [ ] Task comments and attachments
- [ ] Team collaboration features
- [ ] Push notifications
- [ ] Calendar integration
- [ ] Voice input
- [ ] Dark mode
- [ ] Data export

## 📝 Development Notes

- Uses pnpm workspace for monorepo management
- Follows Expo Router best practices
- Implements proper TypeScript types throughout
- Uses Supabase RLS for security
- Optimized for performance with React hooks

## 🧪 Testing

Run tests with:

```bash
pnpm test
```

The app includes unit tests for components and services using Vitest.
