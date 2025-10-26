# Scribbly - Planning Document

## Purpose & User Value

Scribbly is a digital note-taking app that combines the flexibility of handwriting with the power of digital organization, allowing users to create, organize, and search handwritten notes on their mobile devices. It provides a natural writing experience with advanced features like shape recognition, text conversion, and cloud sync. The app empowers students, professionals, and creatives to capture ideas seamlessly while maintaining the cognitive benefits of handwriting.

## Core MVP Feature List

- Digital ink drawing with pressure sensitivity
- Notebook and page organization system
- Basic drawing tools (pen, highlighter, eraser)
- Shape recognition (circles, rectangles, lines)
- Page templates (lined, grid, blank, dotted)
- Export to PDF functionality
- Cloud sync via Supabase
- Search within notebooks

## Future / Nice-to-Have Features

- Handwriting to text conversion (OCR)
- Audio recording synchronized with notes
- Collaborative notebooks with real-time sync
- Advanced shape library and stickers
- Custom page templates
- Apple Pencil / stylus optimization
- Document scanner integration
- LaTeX math equation support
- Flashcard generation from notes
- AI-powered note summaries

## Domain Entities & Relationships

- User (id, email, name, subscription_tier, storage_used)
- Notebook (id, user_id, title, cover_color, created_at, updated_at)
- Page (id, notebook_id, page_number, template_type, content_data)
- Stroke (id, page_id, path_data, color, width, tool_type, timestamp)
- Template (id, name, type, grid_data, is_custom)
- Export (id, user_id, notebook_id, format, export_url, created_at)
- SharedNotebook (id, notebook_id, shared_with_email, permission_level)
- Attachment (id, page_id, type, file_url, position)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                     │
├─────────────────────────────────────────────────────────┤
│  Screens (Expo Router)  │  Core Drawing Engine          │
│  - Notebooks List       │  - Gesture Recognizer         │
│  - Page Editor          │  - Stroke Renderer            │
│  - Settings             │  - Shape Detector             │
│  - Template Gallery     │  - Export Manager             │
├─────────────────────────────────────────────────────────┤
│              React Native Skia / Canvas                  │
├─────────────────────────────────────────────────────────┤
│              Supabase Client SDK                         │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────┐
│                  Supabase Backend                        │
├─────────────────────────────────────────────────────────┤
│  Auth  │  Database  │  Storage   │ Realtime │  Edge Fn  │
│        │  - notes   │  - pages   │ - collab │  - search │
│        │  - strokes │  - exports │          │  - ocr    │
│        │  - shared  │  - assets  │          │           │
└─────────────────────────────────────────────────────────┘
```

## Proposed Folder Structure

```
/apps/scribbly-goodnotes/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── notebooks.tsx
│   │   ├── recent.tsx
│   │   └── search.tsx
│   ├── notebook/
│   │   ├── [id]/
│   │   │   └── page/
│   │   │       └── [pageId].tsx
│   │   └── new.tsx
│   ├── editor.tsx
│   └── _layout.tsx
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx
│   │   ├── ToolPalette.tsx
│   │   ├── NotebookCard.tsx
│   │   └── PageThumbnail.tsx
│   ├── contexts/
│   │   ├── DrawingContext.tsx
│   │   ├── NotebookContext.tsx
│   │   └── SyncContext.tsx
│   ├── hooks/
│   │   ├── useDrawing.ts
│   │   ├── useGestures.ts
│   │   └── useSync.ts
│   └── utils/
│       ├── drawing.ts
│       ├── export.ts
│       └── geometry.ts
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    ├── functions/
    │   └── search-notes.ts
    └── seed.sql
```

## Two-Sprint Roadmap

### Sprint 1 (Week 1) - Core Drawing & Storage

- Set up Expo project with React Native Skia for drawing
- Implement basic drawing canvas with touch/pen input
- Create pen, highlighter, and eraser tools
- Build notebook and page data models
- Implement local storage for strokes
- Create notebook list and page navigation
- Set up Supabase integration for cloud sync

### Sprint 2 (Week 2) - Enhanced Features & Polish

- Add shape recognition (circles, rectangles, straight lines)
- Implement page templates (lined, grid, dotted)
- Build PDF export functionality
- Add undo/redo functionality
- Create search within notebooks feature
- Implement page thumbnails and previews
- Polish UI with smooth animations
- Add basic settings and preferences

## Key Risks & Mitigations

1. **Drawing Performance on Low-End Devices**

   - Risk: Lag or stuttering when drawing complex pages
   - Mitigation: Implement stroke optimization, use React Native Skia, limit stroke points

2. **Large File Sizes for Handwritten Notes**

   - Risk: Storage costs and sync performance issues
   - Mitigation: Compress stroke data, implement progressive sync, set storage limits

3. **Cross-Platform Drawing Consistency**

   - Risk: Different behavior between iOS and Android
   - Mitigation: Extensive testing, use standardized gesture libraries

4. **Handwriting Recognition Accuracy**

   - Risk: Poor OCR results frustrating users
   - Mitigation: Start with basic features, use quality third-party services

5. **Real-time Collaboration Complexity**

   - Risk: Conflict resolution for simultaneous edits
   - Mitigation: Start with view-only sharing, implement CRDT-like approach later

6. **Battery Drain from Continuous Drawing**
   - Risk: Heavy battery usage during long note sessions
   - Mitigation: Optimize rendering, implement power-saving modes

## First 3 Actionable Engineering Tasks

1. **Set Up Drawing Infrastructure**

   - Install and configure React Native Skia
   - Create basic DrawingCanvas component
   - Implement touch event handling for drawing

2. **Design Note Storage Schema**

   - Create Supabase tables for notebooks, pages, strokes
   - Design efficient stroke data format
   - Set up storage buckets for exports

3. **Build Basic Drawing Tools**
   - Implement pen tool with variable width
   - Create color picker component
   - Add undo/redo functionality with gesture support
