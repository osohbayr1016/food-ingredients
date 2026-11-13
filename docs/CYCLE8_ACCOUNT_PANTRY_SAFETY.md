# Cycle 8 — Account pantry, data controls and recipe evidence

## Completed waves

### Wave 1 — Cross-device pantry
- Authenticated `GET/PUT /me/pantry` with 100-item limit, strict validation and Cloudflare D1 persistence.
- Transactional compare-and-swap revision checks. An outdated device receives HTTP 409 instead of overwriting another device.
- Existing local pantry is never overwritten automatically. Users explicitly save from or restore to this browser.
- Guests can continue using local pantry without creating an account.

### Wave 2 — User data and session security
- `GET /me/export` includes account (no password hash), saved and liked recipes, cooking history, nutrition profile, pantry and editorial history.
- `DELETE /me/nutrition` removes sensitive dietary data without affecting the account.
- `DELETE /me/account` requires exact username and password; admin accounts cannot be deleted from the normal UI. User-owned saved/history/likes/nutrition/pantry rows cascade. Editorial actor identifiers are anonymized while the immutable publication record remains.
- Explicit `POST /auth/revoke-all` invalidates previously issued tokens through per-account session versions.
- Protected bearer authentication checks that the account still exists and has the expected role and session version, before private requests are processed.
- JWT header and claim checks are stricter. Pre-existing sessions start at version 0 for migration compatibility.
- Profile UI offers data export, nutrition deletion, all-device sign out, and carefully confirmed account deletion.

### Wave 3 — Trust and provenance
- Additive `recipe_evidence` table for source-backed allergen and per-serving nutrition claims and editorial notes.
- Admin forms capture HTTPS evidence references.
- Reviewed-allergen or numeric nutrition claims without evidence references fail new validation.
- Existing recipes without such evidence remain browsable, but will not qualify for safety/health filters; public detail explains unverified claims instead of implying they are safe.
- The source reference is **not independently verified** by the software. The human reviewer must confirm it supports each claim.

## New additive migration order (only on a separately authorized deployment)
1. Existing migrations through `0014_ingredient_unicode_fts.sql`.
2. `0015_user_pantry_snapshots.sql`
3. `0016_session_revocation.sql`
4. `0017_recipe_evidence.sql`
5. Deploy the new API Worker **before** the new web frontend.

Migrations are included in the **manual** Cloudflare workflow. Do not run them against production merely by merging a pull request. Take a tested database backup/recovery point first. API/Web deploy must be coordinated because pantry and revocation endpoints require the new schema.

## Validation
- SQLite migration smoke, idempotence, cascade deletes and session version tests.
- Strict pantry validation and JWT signature/version unit tests.
- Editorial safety validation and evidence gating tests.
- Existing API/Web TypeScript checks, lint, Wrangler dry-run and frontend production build.

## Still open
- Production-size load and browser/mobile E2E testing.
- HttpOnly cookie-based sessions (current bearer JWT still uses browser localStorage).
- Trusted, licensed recipe and video acquisition with documented rights; auto publishing remains intentionally off without content review.
- A curated and validated ingredient-level allergen/nutrition database; an evidence link alone does not establish scientific accuracy.
- Automatically merged, conflict-resolving pantry sync. This release uses *manual save/restore* with safe version conflicts.
- Full guest data export of on-device records, advanced meal recommendations, substitution testing, barcode/voice/community.
- Real-device accessibility, animations/performance and live production verification.

**No deployment or background task was created.**
