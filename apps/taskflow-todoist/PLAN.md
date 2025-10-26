# TaskFlow - Planning Document

## Purpose & User Value

TaskFlow is a powerful task management app that helps individuals and teams organize, prioritize, and track their work through intuitive project hierarchies, smart scheduling, and productivity insights. It transforms overwhelming to-do lists into manageable action plans with features like natural language input, recurring tasks, and collaborative workspaces. The app empowers users to achieve more by providing clarity on what needs to be done, when it needs to be done, and how progress is tracking over time.

## Core MVP Feature List

- Task creation with title, description, due date, priority
- Project organization with nested sub-projects
- Natural language input for quick task entry
- Task labels and filtering
- Today, Upcoming, and custom views
- Recurring tasks with flexible patterns
- Task completion tracking
- Basic productivity statistics

## Future / Nice-to-Have Features

- Team collaboration with task assignment
- Calendar integration (Google, Apple)
- File attachments and comments
- Time tracking and Pomodoro timer
- AI-powered task suggestions and scheduling
- Kanban board view
- Gantt charts for project planning
- Email-to-task forwarding
- Voice input for tasks
- Integration with other productivity tools

## Domain Entities & Relationships

- User (id, email, name, timezone, premium_tier)
- Project (id, user_id, name, color, parent_id, order_index)
- Task (id, project_id, title, description, due_date, priority, completed_at)
- Label (id, user_id, name, color)
- TaskLabel (task_id, label_id)
- RecurringPattern (id, task_id, pattern_type, pattern_data, next_due)
- TaskHistory (id, task_id, action, timestamp, old_value, new_value)
- ProductivityStats (user_id, date, tasks_completed, tasks_created)
- Collaboration (project_id, user_id, role, invited_by)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Task Management Engine       │
│  - Inbox                │  - Natural Language Parser    │
│  - Today                │  - Recurring Task Generator   │
│  - Projects             │  - Smart Scheduler            │
│  - Labels               │  - Notification Manager       │
├─────────────────────────────────────────────────────────┤
│           Local Storage & Background Tasks               │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - tasks   │  - files  │  - sync  │  - parse  │
│        │  - projects│           │  - collab │  - stats  │
│        │  - history │           │           │  - remind │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/taskflow-todoist/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── inbox.tsx
│   │   ├── today.tsx
│   │   ├── upcoming.tsx
│   │   └── projects.tsx
│   ├── task/
│   │   ├── new.tsx
│   │   └── [id]/
│   │       └── edit.tsx
│   ├── project/
│   │   └── [id].tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── TaskItem.tsx
│   │   ├── QuickAdd.tsx
│   │   ├── ProjectTree.tsx
│   │   ├── DatePicker.tsx
│   │   └── PrioritySelector.tsx
│   ├── contexts/
│   │   ├── TaskContext.tsx
│   │   ├── ProjectContext.tsx
│   │   └── SyncContext.tsx
│   ├── hooks/
│   │   ├── useTasks.ts
│   │   ├── useProjects.ts
│   │   └── useProductivity.ts
│   └── utils/
│       ├── natural-language.ts
│       ├── recurring.ts
│       └── notifications.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── parse-natural-language.ts
    │   └── generate-stats.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Task Management

- Set up Expo project with TypeScript and navigation
- Design database schema for tasks and projects
- Implement task CRUD operations
- Build inbox and today views
- Create quick-add functionality with basic parsing
- Implement project hierarchy and organization
- Add task filtering by project and date
- Set up local storage for offline support

### Sprint 2 (Week 2) - Advanced Features & Polish

- Add recurring task functionality
- Implement labels and multi-select filtering
- Build natural language parser for dates and priorities
- Create productivity statistics dashboard
- Add push notifications for reminders
- Implement drag-and-drop for task reordering
- Build search functionality
- Polish UI with animations and gestures

## Key Risks & Mitigations

1. **Natural Language Processing Complexity**

   - Risk: Parser failing to understand user input correctly
   - Mitigation: Start simple, provide manual fallbacks, iterate based on usage

2. **Offline Sync Conflicts**

   - Risk: Data conflicts when syncing offline changes
   - Mitigation: Clear conflict resolution rules, last-write-wins with history

3. **Recurring Task Edge Cases**

   - Risk: Complex patterns causing incorrect task generation
   - Mitigation: Limit pattern complexity initially, thorough testing

4. **Performance with Large Task Lists**

   - Risk: UI lag with thousands of tasks
   - Mitigation: Pagination, virtual scrolling, smart indexing

5. **Notification Reliability**

   - Risk: Users missing important reminders
   - Mitigation: Multiple notification channels, in-app indicators

6. **Data Privacy for Teams**
   - Risk: Unauthorized access to shared projects
   - Mitigation: Robust permission system, audit trails

## First 3 Actionable Engineering Tasks

1. **Set Up Task Management Core**

   - Design Supabase schema for tasks, projects, labels
   - Create task CRUD operations with optimistic updates
   - Build basic task list component

2. **Implement Project Hierarchy**

   - Create project tree data structure
   - Build nested project navigation
   - Implement task-project relationships

3. **Build Quick-Add System**
   - Create natural language input component
   - Implement basic date/priority parsing
   - Add keyboard shortcuts for efficiency
