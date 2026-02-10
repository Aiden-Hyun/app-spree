# AI-Filtered Mobile Browser — Production Plan

## Executive summary

This document outlines a production-grade plan to build and operate a mobile browser application that automatically filters triggering content using AI-driven meaning-based classification and DOM-level page editing. The design goal is simple from a user standpoint: the user browses normally, but the app silently removes or replaces triggering content, with no blur and no “tap to view” escape hatch.

The plan emphasizes (1) reliability on highly dynamic websites (starting with YouTube), (2) security and privacy appropriate for sensitive content, (3) low-latency classification via batching and caching, and (4) operational rigor (monitoring, feature flags, regression protection) to keep the product stable as sites evolve.

## Product scope and non-negotiable behavior

The core product promise is that user behavior remains the same. The user can search, scroll, and click as they normally would. The app must prevent exposure to triggering content by automatically editing the rendered page.

Non-negotiables:

* No blur and no reveal controls. If content is filtered, it cannot be unhidden through in-app interaction.
* Filtering is meaning-based, not solely keyword-based.
* The system must work on dynamic infinite-scroll pages and continuously filter newly loaded content.

Initial target surfaces:

* YouTube Home feed, Search results, Watch page “Up next,” and Comments.

## User-defined policy model

Your requirements include both standard safety patterns (toxicity, violence/casualties) and personal triggers (political debate topics, societal “doom” news). Many standard moderation systems do not treat politics or general “bad news” as harmful categories. Therefore, policy must be explicitly defined as product behavior and implemented via a dedicated classification layer.

Policy must output one of three actions per content block:

* ALLOW: Render as-is.
* REMOVE: Delete the entire content container from the DOM.
* REWRITE: Replace the content container’s visible text with a safe, neutral placeholder that provides no reveal path.

A separate action exists for pages that should be blocked entirely:

* BLOCK_PAGE: Replace the document body with a safe internal “Blocked” screen.

## System architecture

### Client (Expo/React Native)

The app uses a WebView to display real webpages. Filtering is applied through injected JavaScript that extracts candidate content blocks and later edits the DOM based on classification results.

The client must include:

* A WebView container with controlled navigation.
* A site adapter layer (e.g., YouTube adapter) that knows how to find and remove the correct DOM containers.
* A bridge for two-way messaging between the webpage and React Native.
* A “flash prevention” mechanism to avoid the user seeing triggering content briefly before it is removed.

### Backend (recommended)

Although local inference is possible, a backend enables stronger models and faster iteration. The backend owns all model credentials. The client never holds Hugging Face tokens.

Core backend responsibilities:

* Batch classification endpoint.
* Caching for repeated texts.
* Rate limiting and abuse prevention.
* Observability and safe logging.

### Models (selected)

The selected Hugging Face models are used as follows:

* Toxic comment detection: `unitary/unbiased-toxic-roberta`.
* Topic/trigger classification: `joeddav/xlm-roberta-large-xnli` using zero-shot labels for your policy categories.
* Optional personalization later: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` for prototype similarity.

## How filtering works end-to-end

The production flow is intentionally similar to how ad blockers operate, except the decision engine is AI-based.

1. The WebView loads a page.
2. Injected JavaScript scans the DOM for candidate content blocks, such as a YouTube video card or a comment thread.
3. For each candidate block, the script extracts visible text from a child node (e.g., title text) but assigns the candidate ID to the container node that should be removed (e.g., the entire card). This is critical; the app must remove the whole content block, not just the text span.
4. The script posts a batch of candidates (id, text, role, site, page) to the React Native layer.
5. React Native sends candidates to the backend for classification.
6. The backend applies model inference and policy logic and returns an action per id.
7. React Native injects a small JavaScript snippet to call an in-page function that applies actions. For REMOVE, the container is removed. For REWRITE, the container content is replaced with a safe placeholder.
8. A MutationObserver continues scanning as the page dynamically loads more content, repeating steps 2–7.

## DOM editing mechanism

DOM editing uses standard browser APIs inside the WebView context. No special HTML editing tool is needed.

Key browser primitives:

* `querySelector`/`querySelectorAll` to locate nodes.
* `closest()` to find the correct removable container.
* `remove()` to delete containers.
* `textContent` and controlled element replacement to rewrite content safely.
* `MutationObserver` to catch newly inserted nodes on infinite scroll.

A design requirement is that IDs are bound to removable containers. Text is extracted from sub-elements, but the stored node for actions is the container (video card, comment thread, etc.).

## YouTube adapter strategy

YouTube is dynamic and changes structure over time, so it must be implemented as a dedicated adapter module.

The adapter should implement:

* Candidate discovery for each surface (Home, Search, Watch/Up next, Comments).
* Container selection rules using `closest()` with fallback selectors.
* A MutationObserver that identifies newly added candidates and debounces batches.

The adapter should support a safe fallback mode when selectors fail. For example, if reliable card detection fails, the app can temporarily remove entire sections (such as comments) to maintain safety.

## Classification policy design

### Role-specific routing

Classification should be role-aware rather than using one model for everything.

* Comments route to toxicity classification.
* Titles/cards route to zero-shot topic classification.
* Article paragraphs (for future expansion) typically route to REWRITE rather than REMOVE to preserve page structure.

### Zero-shot label set

Zero-shot performance is highly sensitive to label phrasing. Labels should be written as clear topics, not single words, and should include synonyms.

A recommended starting label set for your policy:

* “politics and political debate, elections, government, geopolitics”
* “societal bad news and doom news, crisis, fear-inducing news”
* “violence and casualties, killing, assault, war casualties”
* “comedy and stand-up, crowd work, playful roasting”
* “neutral everyday content, hobbies, food, ASMR, lifestyle”

The policy layer maps labels to actions. Politics, doom news, and violence map to REMOVE for cards and to REWRITE for paragraphs. Comedy and neutral map to ALLOW.

### Thresholding and uncertainty

Production behavior should be safety-first. When confidence is near threshold, the default should prefer blocking for high-risk categories. However, false positives on comedy must be actively monitored because they degrade user experience.

## Performance, latency, and caching

Meaning-based filtering can require scoring many small text blocks. The solution is batching, caching, and prioritization.

Client-side batching:

* Batch 32–64 candidates per request.
* Debounce DOM scans during scroll events.
* Do not resubmit candidates whose text hash has already been processed recently.

Server-side caching:

* Use a cache keyed by hash(text + role + labels_version).
* Apply different TTLs by role (titles longer; comments shorter).
* Cache hit rate is a primary KPI because it drives cost and latency.

Flash prevention:

* Use a native overlay while the first filter pass completes.
* Alternatively, inject CSS to hide target containers initially and unhide after filtering.

## Security and privacy

This product touches sensitive content. The security posture must be conservative.

* Never ship Hugging Face tokens in the client.
* Minimize data: the server should not persist raw text by default.
* Logs should store only hashes, labels, and aggregate metrics unless explicit debug mode is enabled.
* Use HTTPS everywhere and certificate pinning if feasible.
* Apply rate limiting per device/user to prevent abuse.

## Operational excellence

Reliability depends on monitoring and rapid recovery from DOM changes.

Required production controls:

* Feature flags for adapter updates and policy changes.
* Crash reporting and performance monitoring (WebView errors, time-to-filter, p95 classify latency).
* A regression test suite using your JSONL benchmark.
* Automated smoke tests to detect when YouTube selectors break.

A “safe fallback” mode should exist. If the adapter is partially broken, the app should default to more aggressive removal on affected surfaces rather than exposing unfiltered content.

## Quality assurance and evaluation

Testing must occur at three layers.

Model evaluation:

* Run the JSONL benchmark through the backend and compute false positives/negatives by category.

Integration tests:

* Validate end-to-end behavior on real YouTube pages: scrolling, navigation, and content loading.

User experience tests:

* Ensure no reveal paths exist.
* Ensure content does not flash before removal.
* Validate that the browsing flow remains natural.

## Release plan

The release approach prioritizes achieving one excellent supported experience before broadening coverage.

Phase 1: YouTube-only MVP

* Home feed card removal, Search card removal, Watch page recommendations filtering, comment toxicity removal.
* Backend classification with caching.
* Overlay-based flash prevention.
* Basic settings with cooldown for disabling filters.

Phase 2: Hardening and anti-bypass

* Cooldown-based settings changes and optional PIN.
* Stronger fallback mode.
* Automated adapter regression checks.

Phase 3: Expansion

* Add a small set of news sites with paragraph-level rewriting.
* Add optional embedding-based personalization.

## Engineering deliverables

To move from plan to implementation, the following deliverables should be produced:

* A React Native WebView browser screen with a robust bridge.
* A YouTube adapter module implementing candidate discovery, container mapping, and MutationObserver.
* A backend classification service with Hugging Face inference, caching, and policy logic.
* A benchmark runner that reads JSONL tests and produces accuracy and error reports.
* Monitoring dashboards for latency, cache hit rate, and filtering rates.

## Definition of done for production readiness

The system is production-ready when:

* YouTube filtering works across Home, Search, Watch, and Comments with acceptable stability.
* No reveal controls exist and filtered content cannot be easily unhidden.
* Time-to-filter prevents visible flashes of triggering content.
* Backend meets latency goals with strong cache hit rates.
* Regression tests and monitoring detect adapter breakage quickly.
* Security and privacy requirements are implemented and verified.
