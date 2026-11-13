# Cycle 7 — Simplified, mobile-first cooking experience

## Product principle
Every primary screen should help the visitor answer one of three questions:
1. **Жор хайх** — Which recipe do I want?
2. **Миний орц** — What can I make from ingredients I have?
3. **Төлөвлөх** — What will I cook this week?

Other sections remain available as secondary destinations: saved recipes, profile, cuisine browsing, editorial tools and account management. No existing user data is deliberately removed.

## Implemented UX waves

### Wave 1 — reduce cognitive load
- Three stable primary destinations in desktop and mobile navigation.
- Mobile footer uses equal, easy-to-tap targets instead of five competing actions and an oversized centre FAB.
- Logo remains a Home link; account and saved access stay in the top header or profile.
- The homepage uses one prominent search input, three simple journeys and the recipe feed.
- Recipe cards have more readable single-column layout on narrow phones, compact information and gentle interactions.

### Wave 2 — clarify each primary flow
- Search has one obvious text input, quick filters for 15/30/60 minutes and easy recipes, pagination, proper empty/error states and retry.
- Advanced homepage filters are collapsed by default (automatically open for active advanced conditions).
- Pantry is a clear three-step flow: add ingredients, select them, find matching recipes. Size/expiry fields are optional disclosures rather than always-visible forms.
- Ingredients recognized by photo are selected when capacity allows; the user must still confirm the underlying recognition suggestions.
- Suggestion explorer shows compact removable ingredient chips, optional quantities, loading/empty states and two common sort controls.
- Recipe detail shows title/time/servings before the large image, with compact image layout, plus/minus serving controls, optional tips disclosure and accessible cooking CTA.
- Profile library and guest liked recipes have retryable errors. Guest profile settings are collapsed to reduce visual noise.
- Discover catalogue uses compact cuisine chips and an optional occasion section instead of large duplicate navigation tiles.

### Wave 3 — trust and regression coverage
- Unicode61 FTS ingredient index for Mongolian Cyrillic and translated aliases: migration `apps/api/db/0014_ingredient_unicode_fts.sql`.
- FTS updates on canonical/alias insert, update and deletion; idempotent backfill migration smoke tests.
- Ingredient picker offers keyboard selection, Escape closing, ARIA combobox/listbox and loading states.
- Navigation contract unit tests run in CI before frontend production build.

## Migration and release requirements
- This cycle is **code-only**. Never claim production UX has changed until a separately authorized deployment.
- Apply existing migrations up to `0013_editorial_audit.sql` **before** `0014_ingredient_unicode_fts.sql`, then deploy API and frontend together. The manual Cloudflare workflow includes the ordered migration.
- Verify D1 backup/recovery and that all FTS5 virtual tables are supported in the target D1 environment before the migration.
- Restart/redeploy old API versions only with compatible schema; the new ingredient catalog route depends on `ingredient_search_fts`.
- Do not turn on recipe import/publishing automatically.

## Verified scope and limitations
- GitHub CI covers schema smoke tests, API and Web TypeScript, lint, unit tests, Wrangler dry-run and frontend production build.
- **Not yet verified:** browser-driven E2E flows, real-device accessibility and frame rate, large-catalogue latency, production D1 migration, or live Cloudflare deployment.
- Other Cycle 6 outstanding issues remain open: licensed content ingestion, verified ingredient-level nutrition and allergen data, safe substitutions, cross-device syncing, stronger session security, community features, and voice/barcode assistants.
