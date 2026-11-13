# Cycle 6: search trust, editorial workflow, and smoother cooking

This is a **code-only** implementation; no deployment or scheduled task was created.

## Phase 1 — correctness and safety
- [x] Unicode61 FTS5 index for case-insensitive Mongolian Cyrillic, Latin and recipe/ingredient aliases, with backfill and edit triggers.
- [x] SQL migration smoke tests for title, ingredient and alias changes.
- [x] Opt-in approved daily publishing now reserves a unique UTC day transactionally; duplicate scheduled invocations cannot publish two different queued recipes.
- [x] Every recipe edit invalidates earlier approval and unpublishes until fresh review.
- [x] Explicit editorial actions: save draft, attest approval, then publish immediately or queue for a daily release.
- [x] Track reviewer events and actual publication dates, so newly published drafts sort as new.
- [x] Keep imported recipes as unreviewed drafts, with no unattended public posting.
- [x] Remove hardcoded development admin token; preserve auth session on temporary backend faults.

## Phase 2 — core user journeys
- [x] Simpler homepage and Mongolian bottom navigation.
- [x] Select **any** 30 usable pantry ingredients from up to 100 saved; no silent first-30 matching.
- [x] Consider up to 120 pantry candidate recipes before final quantity-aware sorting (bounded result set).
- [x] Guest cooking completion; no forced sign-in after cooking.
- [x] Sanitize serving count from URL to safe integer range.
- [x] Genuine API/network failures use the error boundary rather than a fake 404.
- [x] Combine compatible recipe/shopping units while never converting volume to mass without known density.
- [x] Paginated meal-planner search that does not show stale results from previous queries.
- [x] Mongolian retry screen without exposing internal error text, reduced-motion styles, Cyrillic-capable font.
- [x] Recipe-specific Open Graph metadata and JSON-LD structured recipe instructions.

## Phase 3 — verification
- [x] CI database migrations applied twice to prove idempotence; verify FTS updates and day locks.
- [x] Node tests for publication guard, search inputs, shopping arithmetic and pantry matching.
- [x] API/Web typechecks, lint, Wrangler dry-run and Cloudflare-compatible frontend build required before merge.
- [ ] Real-device/browser E2E suite, accessibility audit, performance lab (needs staging setup and browser test fixtures).
- [ ] Load testing large multilingual ingredient index on production-sized catalogues.

## Required migration order on the **next manually approved deployment**
1. Existing migrations through `0010_publication_queue.sql`.
2. `0011_unicode_recipe_search.sql` — Unicode FTS5; backfills existing recipes.
3. `0012_publication_days.sql` — one UTC date reservation.
4. `0013_editorial_audit.sql` — reviewer audit and publication date.
5. Deploy the new Worker API, then the web Worker.

The manual Cloudflare workflow applies migrations in that order. Never execute remote D1 migrations for this code-only cycle without a separately authorized release. FTS5 has additional backup/export requirements; take a verifiable D1 recovery point and review Cloudflare's virtual-table export limitations before deploying.

`AUTO_IMPORT_ENABLED=false` and `AUTO_DAILY_PUBLISH=false` are intentional. Quality-controlled daily publication requires licensed sources and a regularly maintained, approved queue. An empty queue must result in **zero** new publications.

## Still unimplemented — do not claim complete
- Licensed multilingual recipe ingestion at scale, credible ingredient-level nutrition and allergen provenance, robust food substitution safety.
- User-specific meal recommendation from verified per-portion macros and dietary profile; low-appetite education vetted by experts.
- Cross-device pantry, family sharing, barcode, voice assistant and community.
- Secure HttpOnly session migration, user self-service export/delete, account-level rate limits.
- Production D1 migration, deployment and live-browser validation.
