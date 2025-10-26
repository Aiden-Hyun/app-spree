# LeafReader - Planning Document

## Purpose & User Value

LeafReader is a comprehensive eBook reader app that transforms mobile devices into powerful digital libraries, offering immersive reading experiences with customizable display options, seamless syncing, and intelligent features like vocabulary building and reading insights. It makes reading more accessible and enjoyable by providing features like adjustable fonts, themes, and highlighting tools while tracking reading progress across devices. The app encourages consistent reading habits through gamification and social features that connect readers around shared literary interests.

## Core MVP Feature List

- EPUB and PDF file support
- Customizable reading view (fonts, sizes, themes, margins)
- Library organization with collections
- Reading progress sync across devices
- Bookmarks and highlights with notes
- Night mode and sepia themes
- Search within books
- Reading time statistics

## Future / Nice-to-Have Features

- Built-in bookstore integration
- Vocabulary builder with dictionary lookup
- Text-to-speech functionality
- Social reading features (reviews, quotes sharing)
- Reading challenges and goals
- Translation support
- Goodreads integration
- Note export to various formats
- Speed reading mode
- Audiobook synchronization

## Domain Entities & Relationships

- User (id, email, username, reading_goal, total_books_read)
- Book (id, title, author, isbn, cover_url, file_url, page_count)
- UserBook (user_id, book_id, reading_status, progress_percent, last_read_position)
- ReadingSession (id, user_id, book_id, start_time, end_time, pages_read)
- Highlight (id, user_id, book_id, text, color, note, position, created_at)
- Bookmark (id, user_id, book_id, position, name, created_at)
- Collection (id, user_id, name, description)
- CollectionBook (collection_id, book_id, added_at)
- ReadingStats (user_id, date, minutes_read, pages_read, books_finished)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Reader Engine                │
│  - Library              │  - EPUB Parser                │
│  - Reader View          │  - PDF Renderer               │
│  - Collections          │  - Annotation Manager         │
│  - Stats                │  - Sync Engine                │
├─────────────────────────────────────────────────────────┤
│           File System & Document Viewer APIs             │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage  │ Realtime │  Edge Fn  │
│        │  - books   │  - epubs  │  - sync  │  - stats  │
│        │  - progress│  - covers │          │  - parse  │
│        │  - notes   │  - pdfs   │          │           │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/leafreader-kindle/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── library.tsx
│   │   ├── reading-now.tsx
│   │   ├── collections.tsx
│   │   └── stats.tsx
│   ├── reader/
│   │   └── [bookId].tsx
│   ├── book/
│   │   └── [id]/
│   │       ├── details.tsx
│   │       └── notes.tsx
│   ├── import.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── BookCover.tsx
│   │   ├── ReaderView.tsx
│   │   ├── HighlightMenu.tsx
│   │   ├── ReadingProgress.tsx
│   │   └── ThemeSelector.tsx
│   ├── contexts/
│   │   ├── LibraryContext.tsx
│   │   ├── ReaderContext.tsx
│   │   └── SyncContext.tsx
│   ├── hooks/
│   │   ├── useEpubParser.ts
│   │   ├── useReadingStats.ts
│   │   └── useAnnotations.ts
│   └── utils/
│       ├── epub-parser.ts
│       ├── reading-position.ts
│       └── file-import.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   ├── calculate-stats.ts
    │   └── extract-metadata.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Reading Experience

- Set up Expo project with file handling
- Implement EPUB parsing and rendering
- Create customizable reader view
- Build library screen with grid/list views
- Add reading progress tracking
- Implement bookmarks functionality
- Create basic theme system (light/dark/sepia)
- Set up local storage for books

### Sprint 2 (Week 2) - Advanced Features & Sync

- Add highlighting with color options
- Implement note-taking on highlights
- Build reading statistics dashboard
- Create collections for organization
- Add cross-device sync
- Implement search within books
- Build reading time tracker
- Polish UI with page turn animations

## Key Risks & Mitigations

1. **EPUB Format Complexity**

   - Risk: Inconsistent rendering across different EPUB versions
   - Mitigation: Use robust parsing library, test with various formats, graceful fallbacks

2. **Large File Handling**

   - Risk: Memory issues with large PDFs or image-heavy books
   - Mitigation: Implement streaming, pagination, lazy loading of resources

3. **DRM and Copyright Concerns**

   - Risk: Legal issues with book sharing or pirated content
   - Mitigation: Personal library only, no sharing features, clear terms of service

4. **Sync Conflicts**

   - Risk: Reading position conflicts between devices
   - Mitigation: Timestamp-based resolution, clear sync indicators

5. **Performance on Long Books**

   - Risk: Slow navigation in books with thousands of pages
   - Mitigation: Efficient indexing, chapter-based loading, position caching

6. **Storage Limitations**
   - Risk: Device storage filling up with downloaded books
   - Mitigation: Smart caching, cloud storage options, storage warnings

## First 3 Actionable Engineering Tasks

1. **Set Up EPUB Parser**

   - Research and integrate EPUB parsing library
   - Create book import functionality
   - Extract and display metadata

2. **Build Reader View**

   - Implement paginated text display
   - Add font and theme customization
   - Create reading position tracking

3. **Design Library System**
   - Create database schema for books and progress
   - Build library grid UI
   - Implement book cover display and caching
