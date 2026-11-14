# Production readiness — code gate and go-live checklist

## Current code state
- PRs #1, #2 and #7–#13 were squash-merged to `main` with successful CI.
- The corresponding old branches are historical, not extra unmerged feature work. Merging their old commits again would risk reverting newer components.
- Cycle 10 adds bounded credential parsing, safe post-login navigation, session synchronization across tabs, fail-closed origin checks, account-deletion attempt limits, API readiness configuration checks and a deployment smoke runner.
- This is **release-hardening code**, not confirmation that the live Cloudflare deployment has been updated.

## CI release gate
- `python3 apps/api/tests/schema_smoke.py` — creates schema, applies migrations, validates constraints.
- API unit tests — recipe safety, search, pantry quantities, auth input, JWT, CORS, account rate-limit policy and publication queue.
- Web unit tests — navigation, pantry, matching, meal planning, resume state, recipe sorting and redirect safety.
- `pnpm --filter api exec tsc --noEmit`
- `pnpm --filter api exec wrangler deploy --dry-run`
- `pnpm --filter web exec tsc --noEmit`
- `pnpm --filter web lint`
- `pnpm --filter web run pages:build`
- `node --check scripts/smoke-production.mjs`

## Go-live procedure (separately authorized, manually run)
1. Confirm actual rights/licenses and attribution for every public recipe, video and image. Do **not** enable importing production content using TheMealDB's demo key or automatically publish unreviewed drafts.
2. Verify available Cloudflare D1, Workers, R2, bandwidth, and CPU/free-plan allowances. Zero-cost around-the-clock operation is **not guaranteed** at growing traffic.
3. Snapshot the production D1 database and rehearse restoring it to a nonproduction instance. Have a verified last-known-good API and frontend Worker revision ready for rollback.
4. Check Cloudflare secrets `JWT_SECRET`, `ADMIN_SECRET` and configured origins. Ensure JWT secret has high entropy; do not rotate it without a session migration plan.
   **Security migration audit:** Legacy `db/0003_auth_users.sql` historically provisioned a publicly visible fixed admin password hash. Updated repo code no longer creates one; **this does not remove or secure any preexisting database account**. Before go-live, inspect the `users` table for the legacy seed ID, verify role and activity, and revoke/rotate that account using a separately approved database procedure. Never automatically delete a potentially in-use admin or change production database state as part of a code-only audit.
5. Check initial migrations 0002–0006 have already been applied. The manual workflow applies additive migrations 0007–0018 before deploying the API. Never let a new frontend call new endpoints against an old schema.
6. Run the **manual** `Deploy to Cloudflare` GitHub workflow, not an automated deploy trigger. It checks `/health/ready` and the public recipe/cuisine endpoints after API deployment, then builds/deploys the web app and checks home/search/pantry/plan/login.
7. Verify live user journeys on desktop Chrome and mobile Safari/Chrome: signup/login, logout on all devices, guest favorites import, pantry save/restore with two-device conflict, recipe search and safety filters, weekly planner and shopping list, cooking timers/resume and account export/deletion. Use **test accounts**, not customers.
8. Confirm monitoring for API error rate, D1 limits, uncaught frontend errors, unapproved draft counts, and source-backed review status. Fail release on data loss, safety mislabeling, or authorization regression.
9. If smoke or manual tests fail, roll back the API and frontend Workers to their previously verified versions. **Additive D1 migrations are not automatically rolled back**; restore data only from a verified backup under a controlled incident plan.

Manual smoke runner:
```sh
node scripts/smoke-production.mjs api
node scripts/smoke-production.mjs web
```
Environment overrides: `SMOKE_API_ORIGIN` and `SMOKE_WEB_ORIGIN` (HTTPS only).

## No unsafe auto-publish
- `AUTO_IMPORT_ENABLED=false` and `AUTO_DAILY_PUBLISH=false` remain intentionally disabled. The Worker cron can perform maintenance, but new public recipes must have authorized editorial approval.
- The presence of an allergen/nutrition evidence link alone is **not** proof of accuracy. Review ingredient brands, cross-contact risk, portions, original measurements and permitted media rights before publication.

## Remaining go-live blockers / limitations
1. **Real-browser E2E QA and load tests:** CI cannot prove mobile performance, full multi-device behavior, Cloudflare quotas or accessibility with real users.
2. **Session architecture:** bearer JWTs are stored in browser localStorage; a future same-origin HttpOnly-cookie/BFF design plus CSRF policy is recommended before handling high-sensitivity data at scale. Security headers and revocation mitigate but do not eliminate XSS exposure.
3. **Nutrition/allergen science:** evidence fields and strict filters are implemented, but expert review and a validated comprehensive ingredient database are still required; do not market the platform as medically verified.
4. **Licensing and continuous food supply:** source terms, video rights, commercial access, licensed multilingual content and editorial verification must be established before daily publishing can safely be enabled.
5. **Production operations:** real backups, disaster recovery, legal/privacy review, monitoring and domain configuration require action in the actual Cloudflare environment.
6. **Data policy:** account exports now include every saved weekly cloud meal plan (choices, portions, shopping checkboxes, titles and revisions). Guest pantry and guest favorites remain local-device storage. Weekly meal plans also remain local by default, but a signed-in user can explicitly save/restore a separate cloud snapshot for each week; conflict (409) responses require a reload and manual decision.

**Do not claim the site is fully production-ready or that production was deployed from a green GitHub CI alone.**
