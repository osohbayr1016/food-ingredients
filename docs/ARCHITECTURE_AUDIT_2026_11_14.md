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
| P1 | Cross-device weekly meal planner and shopping-list sync | Revision-safe writes, multi-user isolation, deterministic merge |
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
