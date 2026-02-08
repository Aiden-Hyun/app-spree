# Migration Log

## 2026-02-04

- Started legacy-aware freeze and migration plan documentation.
- Moved `useBackgroundAudio` implementation from `src/hooks/useBackgroundAudio.ts` to `src/shared/hooks/useBackgroundAudio.ts`.
- Added legacy compatibility re-export at `src/hooks/useBackgroundAudio.ts`.
- Decomposed `src/shared/data/contentRepository.ts` into domain modules under `src/shared/data/content/`:
  - `narratorsRepository.ts`
  - `playbackProgressRepository.ts`
  - `completedContentRepository.ts`
  - `contentRatingsRepository.ts`
  - `contentReportsRepository.ts`
- Kept `src/shared/data/contentRepository.ts` as a compatibility barrel (`export * from "./content"`).
- Migrated a vertical slice in `music`: moved `SoundPlayer` to `src/features/music/components/SoundPlayer.tsx`.
- Added legacy compatibility re-export at `src/components/SoundPlayer.tsx`.
- Updated imports to prefer `@shared/data/content` and feature/shared alias paths.
- Added regression test: `src/shared/data/content/__tests__/contentRatingsRepository.test.ts`.
- Added lightweight migration guard:
  - `scripts/checkLegacyFreeze.js`
  - `scripts/legacy-freeze-baseline.json`
  - `npm run check:legacy-freeze`
- Added `jsdom` dev dependency required by Vitest `jsdom` environment.
- Migrated cross-feature playback hooks into shared:
  - `src/hooks/useAudioPlayer.ts` implementation moved to `src/shared/hooks/useAudioPlayer.ts`
  - `src/hooks/usePlayerBehavior.ts` implementation moved to `src/shared/hooks/usePlayerBehavior.ts`
- Kept legacy compatibility wrappers at:
  - `src/hooks/useAudioPlayer.ts`
  - `src/hooks/usePlayerBehavior.ts`
- Updated consumer imports to `@shared/hooks/useAudioPlayer` and `@shared/hooks/usePlayerBehavior`.
- Completed broader migration slices:
  - Moved legacy UI implementations from `src/components/*.tsx` to `src/shared/ui/*.tsx`
  - Moved remaining legacy hook implementations from `src/hooks/*.ts` to `src/shared/hooks/*.ts`
  - Moved legacy context implementations from `src/contexts/*.tsx` to `src/core/providers/contexts/*.tsx`
  - Moved utility implementation from `src/utils/courseCodeParser.ts` to `src/shared/utils/courseCodeParser.ts`
- Left compatibility wrapper files in legacy folders (`src/components`, `src/hooks`, `src/contexts`, `src/utils`) to avoid breaking import spikes.
- Updated route and feature imports to target new homes (`@shared/ui`, `@shared/hooks`, `@core/providers/contexts`, `@shared/utils`).
- Updated Expo Router entry files in `app/` to use new alias imports (no direct imports from legacy folders).
- Moved legacy tests:
  - `src/components/__tests__/ProtectedRoute.test.tsx` → `src/shared/ui/__tests__/ProtectedRoute.test.tsx`
  - `src/contexts/__tests__/AuthContext.test.tsx` → `src/core/providers/contexts/__tests__/AuthContext.test.tsx`
- Deleted retired legacy directories after import graph cleanup:
  - `src/components`
  - `src/hooks`
  - `src/contexts`
  - `src/utils`
- Updated alias config to remove legacy paths:
  - `tsconfig.json`
  - `babel.config.js`
  - `vitest.config.ts`
- Reset `scripts/legacy-freeze-baseline.json` to an empty legacy file set.
- Sprint 1 architecture/type stabilization:
  - Added `npm run typecheck` and verified `tsc --noEmit` passes for app code.
  - Fixed platform/API typing mismatches in auth, firebase, and notifications services.
  - Normalized theme and content model contracts to match runtime usage.
  - Added `docs/SPRINT1_TYPE_DEBT.md` as the type debt snapshot.
- Refactored large runtime modules:
  - `src/shared/ui/MediaPlayer.tsx` now delegates side-effect and async orchestration to `src/shared/ui/media-player/useMediaPlayerController.ts`.
  - `src/core/providers/contexts/AuthContext.tsx` now uses shared auth helpers in `src/core/providers/contexts/auth/helpers.ts` and shared types in `src/core/providers/contexts/auth/types.ts`.

## Pending Deletions

- None.
