# Food Ingredients — codebase audit and development backlog (2026-11-14)

This is a code-inspection and public-product comparison. A green CI **does not** establish
production correctness, content rights, nutrition accuracy, mobile performance, or live deployments.

## Current architecture

- **Frontend:** Next.js 15 / React 19, Tailwind 4, client-side pantry, meal planning,
  recipe discovery, cooking timer/progress, profile and editorial screens.
- **Backend:** Cloudflare Hono Worker, D1 relational schema + additive migrations, R2 images.
- **Operations:** manually dispatched Cloudflare deployment workflow, PR CI for TypeScript,
  lint, frontend build, database smoke and selected unit tests.
- **Safety:** explicit editorial approval and an opt-in daily publication queue; allergen
  and nutrition filtering requires recorded evidence. Evidence URLs alone are not
  authoritative food-safety or nutritional verification.

## Confirmed fixes during this audit

1. PR #15: malformed recipe action payloads and unsafe admin upload storage namespaces.
2. PR #16: invalid public recipe filters, malformed admin tag/import data, unbounded
   TheMealDB request duration, duplicate tag errors, and recipe edit not-found semantics.
3. Recipe discovery: allowlisted newest/quickest/easiest sorting with stable pagination
   and an accessible control in search (this PR).

## Remaining highest-priority work

| Priority | Scope | Completion gate |
| --- | --- | --- |
| P0 | Real browser/mobile E2E for login, account deletion, pantry two-device conflict, shopping quantities, cooking timers and admin publishing | Repeatable Playwright/device suite, independent security review |
| P0 | Backups and recovery drills for Cloudflare D1/R2, secrets, rate/usage monitoring, rollout/rollback | Restore rehearsed on nonproduction; documented operator runbook |
| P0 | Approved rights for recipe text and media; no unsafe automatic publication | Legal/source agreement, editorial verification and image/video provenance |
| P1 | Replace deprecated `@cloudflare/next-on-pages` with a supported adapter | Staging parity + green build, SSR, assets and SEO; issue #17 |
| P1 | Ingredient-level licensed nutrition database and allergen provenance | Measured quantities, source licensing, professional validation, confidence reporting |
| P1 | Auth session migration away from localStorage bearer tokens | Same-origin secure HttpOnly cookie/BFF design, CSRF policy, migration tests |
| P1 | Evolve opt-in weekly cloud plan snapshots into automatic cross-device sync | Existing revision-safe manual save/restore works; add conflict visualization, deterministic multi-device merge and real-browser tests |
| P1 | Error reporting and performance baselines | Anonymous crash/latency telemetry, mobile low-memory tests, p95 targets |
| P2 | Source ingestion validation, duplicate detection, reviewer diffs and licensing metrics | Pilot imported drafts reviewed with audit history; import stays opt-in |
| P2 | Pantry expiry-first matching and safe substitutions | No invented quantities/densities; allergy warnings re-evaluated |
| P2 | Household sharing and reusable meal plans | Invitation permissions, concurrent write tests, revoke access |
| P2 | Search relevance tuning: alias morphology, popularity and collection scale | Offline evaluation set for Mongolian/English searches |
| P3 | Barcode/photo ingredient entry | Licensed product data, consent, measured recognition precision and confirm-before-add |
| P3 | Voice cooking controls and offline reader | Accessibility audits, unsupported-browser fallback, no unsafe food advice |
| P3 | Moderated recipes, rating/reviews and AI assistant | Anti-spam/reporting, human approval, allergen-safety abstention |

## Comparison with established consumer products

- [SuperCook](https://apps.apple.com/us/app/supercook-recipe-by-ingredient/id1477747816):
  emphasizes cooking with available ingredients and missing-one-ingredient discovery.
- [Samsung Food](https://support.samsungfood.com/hc/en-us/articles/35369657798548-Getting-Started-with-Meal-Planner):
  demonstrates meal-plan queues, reused plans, sharing and shopping-list conversion.
- [Paprika](https://www.paprikaapp.com/):
  demonstrates multi-device synchronization, recipe import, reusable menus,
  grocery aisle grouping and voice-assisted cooking.

**Recommended architectural sequence:** stabilize tests and safety gates; measure search and
synchronization; migrate the retired runtime adapter behind staging; add versioned
account meal plans and shopping lists; then expand licensed recipe/nutrition data.
Keep Cloudflare production deployment manual and separate from code merges.

---

## Second-pass audit, verification and changes (2026-11-14)

This is a continuation of the same repository audit. Each code change below was merged
through a separate PR after that PR's GitHub Actions validation succeeded. Unit tests,
TypeScript, lint, Cloudflare dry-run and frontend build **are not substitutes** for
real-device, staging, privacy, product-safety or recovery testing.

### Implemented in main

| PR | Verified scope | Remaining caveat |
| --- | --- | --- |
| #25 | Reject malformed nested ingredient/step IDs, optional fields and metadata before D1 writes | External ingestion rights and content validation still need review |
| #26 | Stream uploaded images with 12 MiB bound and PNG/JPEG/WebP magic-byte checking | Signature checks are not full image decoding or malware detection |
| #27 | Validate gallery arrays and reject unsafe image path/URL values | Previously stored invalid gallery records may require manual repair |
| #28 | Authenticated, opt-in weekly plan/portion/shopping snapshots with D1 revision protection and Mongolian save/restore UI | D1 migration 0018 required at future deployment; concurrent edits yield 409 rather than automatic merge |
| #29 | Standalone offline weekly meal-calendar ICS export and corrected shopping-list copy state | Calendar events are all-day, not scheduling/notification reminders |
| #30 | Align visible nutrition and SEO structured data on evidence-backed editorial review | Evidence URLs do not prove independently verified nutritional facts |
| #31 | Include account weekly plans in JSON data export; bound streamed plan writes; no-store private plan reads | Account-data export should be checked in full staging privacy QA |
| #32 | Sanitize historical browser plan/portion/title/checklist storage and clear stale checkboxes after recipe/portion edits | Pantry changes from other workflows can still alter required quantities |
| #33 | Default-disable old direct R2 presign path and bind declared type/exact bytes if explicitly enabled | Direct S3 uploads still need separate content inspection and staging verification |
| #34 | Pause recipe hero autoplay for reduced-motion and interaction; enable keyboard arrow navigation | Full mobile/screen-reader experience is not yet browser-tested |

### Remaining prioritized engineering work

**P0 — must verify before declaring production readiness**
- [#21](https://github.com/osohbayr1016/food-ingredients/issues/21): Inspect and rotate any previously seeded admin credential in a supervised maintenance window; code changes alone cannot revoke a live user.
- [#22](https://github.com/osohbayr1016/food-ingredients/issues/22): Real Playwright/mobile end-to-end tests for auth, delete/export, local/cloud planner conflicts, editor approval, image errors, payments (if introduced) and offline behavior.
- [#23](https://github.com/osohbayr1016/food-ingredients/issues/23): D1/R2 backups, restore drills, incident monitoring, deployment rollback and data retention.
- Recipe/image commercial usage rights, editorial review, cross-contact claims and licensing must be verified before publishing at scale.

**P1 — architecture and safety**
- [#17](https://github.com/osohbayr1016/food-ingredients/issues/17): Replace the retired `@cloudflare/next-on-pages` path behind staging, preserving SEO/SSR, assets and Worker bindings; do not switch infrastructure without parity testing.
- [#35](https://github.com/osohbayr1016/food-ingredients/issues/35): Move browser-readable JWTs to a same-origin secure HttpOnly-cookie/BFF architecture with CSRF controls, revocation tests, migration and rollback.
- [#4](https://github.com/osohbayr1016/food-ingredients/issues/4): Licensed source-based nutrition calculation, allergen provenance and professional food safety review.
- [#3](https://github.com/osohbayr1016/food-ingredients/issues/3): Licensed bilingual content ingestion, duplicate detection, reviewer audit trails, batch metrics, alerting and rights verification.
- Advance manual weekly D1 snapshot compare-and-swap to conflict previews and merge choices. Never silently overwrite another device's latest data.
- Bound all request sizes at shared routing boundaries; enforce monitoring/alerts for Worker 5xx, D1 failures, image upload errors and imports.

**P2 / nice-to-have only after core QA**
- [#5](https://github.com/osohbayr1016/food-ingredients/issues/5): Household sharing, budget shopping estimates with dated local prices, expiry-first pantry matching, shopping aisle grouping and safe substitutes.
- [#6](https://github.com/osohbayr1016/food-ingredients/issues/6): Voice cooking controls, optional barcode/product detection, moderated community recipes and an opt-in grounded culinary assistant.
- One-missing-ingredient discovery, saved meal-plan templates, seasonal Mongolian ingredient recommendations and opt-in pantry-expiry reminders.
- Search quality corpus for bilingual ingredient aliases/Latin Mongolian queries, with per-query precision and latency benchmarks.

### Architecture direction

1. **Keep a narrow trusted core:** browser/Next.js frontend, Hono API Worker,
   D1 for user/recipe/versioned metadata and R2 for rights-approved images.
2. **Use shared input contracts:** validate every JSON field, use bounded streams,
   allowlisted SQL sort fields and a single approved evidence model in public
   recipe pages, search filters and structured metadata.
3. **Treat synchronization as versioned ownership:** keep user ID + ISO week
   as the snapshot key, advance revisions atomically, show conflicts in the UI
   and avoid speculative merges of checked shopping quantities.
4. **Use an auditable editorial boundary:** all imported content begins as
   draft; source licensing, allergen evidence, quantities and human approval
   precede publication. Unreviewed recipes must not inherit trusted metadata.
5. **Build operational parity before migration:** stage real D1/R2, run the
   migration sequence and E2E, record latency/restore/rollback, then authorize
   any future release separately.

### Product comparison and prioritization

- **SuperCook-style** discoverability: emphasize how many pantry ingredients
  are present/missing, but keep unknown quantities and allergies explicit.
- **Samsung Food-style** collaborative planning: build reliable household
  lists only after current manual versioned sync is proven across devices.
- **Paprika-style** convenience: repeatable saved menus, clear grocery
  grouping and reliable recipe import, subject to rights and provenance.

**Release state:** GitHub main includes the listed code PRs; no Cloudflare
production deploy, remote D1 migration, live R2 change or customer-data
mutation was performed in this audit. The remaining P0/P1 items are not complete.
