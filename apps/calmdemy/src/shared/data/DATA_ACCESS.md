# Data Access Guide (Repositories)

This document maps Firestore collections to repository modules and highlights query patterns, index dependencies, and write safety rules.

## Repository Map

- `src/features/meditate/data/meditateRepository.ts`
  - Collections: `guided_meditations`, `meditation_programs`, `breathing_exercises`, `emergency_meditations`, `courses`, `course_sessions`, `subjects`
- `src/features/sleep/data/sleepRepository.ts`
  - Collections: `bedtime_stories`, `sleep_meditations`, `series`
- `src/features/music/data/musicRepository.ts`
  - Collections: `albums`, `sleep_sounds`, `background_sounds`, `white_noise`, `music`, `asmr`
- `src/features/home/data/homeRepository.ts`
  - Collections: `daily_quotes`, `user_favorites`, `listening_history` + content resolver reads from multiple collections
- `src/features/profile/data/profileRepository.ts`
  - Collections: `meditation_sessions`, `users`, `user_favorites`, `listening_history`, `playback_progress`, `completed_content`
- `src/features/admin/data/adminRepository.ts`
  - Collections: `content_jobs`, `users`, `worker_control`, `worker_status`
- `src/shared/data/content/*Repository.ts`
  - Collections: `content_ratings`, `completed_content`, `playback_progress`, `content_reports`, `narrators`
- `src/services/firestoreService.ts`
  - Compatibility barrel that re-exports the repositories above.

## Query Patterns And Index Dependencies

Known queries (non-exhaustive):
- `meditation_programs`: `where('is_active' == true)` + `orderBy('created_at', 'desc')`
  - Requires composite index (`is_active`, `created_at`).
- `meditation_sessions`: `where('user_id' == userId)` + `orderBy('completed_at', 'desc')`
  - Requires composite index (`user_id`, `completed_at`).
- `user_favorites`:
  - `where('user_id' == userId)`
  - `where('user_id' == userId)` + `where('content_id' == contentId)`
  - `where('user_id' == userId)` + `where('content_id' == contentId)` + `where('content_type' == type)`
  - Composite indexes exist for the above patterns in `firestore.indexes.json`.
- `listening_history`:
  - `where('user_id' == userId)` (sorted in memory)
  - If you add `orderBy('played_at')`, add/confirm the composite index (`user_id`, `played_at`).
- `guided_meditations`:
  - `where('themes', 'array-contains', theme)`
  - `where('techniques', 'array-contains', technique)`
- `courses`: `where('code' == code)`
- `sleep_sounds` / `background_sounds`: `where('category' == category)`
- `narrators`: `where('name' == name)`
- `content_ratings`: `where('user_id' == userId)` + `where('content_id' == contentId)`
- `completed_content`: `where('user_id' == userId)` + `where('content_type' == type)`
- `content_jobs`:
  - `where('status' == status)` + `orderBy('createdAt', 'desc')`
  - If Firestore warns about missing indexes, add a composite index (`status`, `createdAt`).

## Write Patterns And Safety Guidelines

- **Do not write `undefined` to Firestore.** The admin job creator strips undefined values before write.
- **Use server timestamps** for event fields (`createdAt`, `updatedAt`, `completed_at`, etc.).
- **Document ID conventions must remain stable** for:
  - `completed_content` and `playback_progress`: `${userId}_${contentId}`
- **User-owned collections** must keep `user_id` in each doc to satisfy security rules.
- **Delete logic** (account deletion) assumes per-collection `user_id` fields exist and are indexed by Firestore.

## How To Add A New Collection Safely

1. Add rules in `firestore.rules`.
2. Add or update indexes in `firestore.indexes.json`.
3. Add TypeScript types in `src/types/index.ts` (or feature-local types).
4. Add repository functions in the appropriate feature or shared module.
5. Update any content resolver logic that needs to read the new collection.
6. Update `FIRESTORE_SCHEMA.md` with collection + field contracts.
