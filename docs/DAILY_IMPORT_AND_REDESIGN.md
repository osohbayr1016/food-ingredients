# Food Ingredients — discovery redesign and daily candidate pipeline

## UI
The homepage now starts with three primary tasks: search, cook with what you have, and browse recipes. The existing pantry matcher, cooking experience, search, saved recipes, and nutrition profile remain intact. Recipe cards show time only if the source contains a real positive number. Mobile bottom navigation remains and desktop now has a usable top navigation.

## Daily automation
Cloudflare Cron Trigger: `20 0 * * *` (08:20 Ulaanbaatar). This is a daily run, not a continuously running server. Free-tier limits and platform reliability apply.

The scheduled handler runs `importDailyCandidate`, currently **disabled** by `AUTO_IMPORT_ENABLED = "false"`. It uses a TheMealDB production supporter key if configured, calls their random meal endpoint, looks up details, validates title/ingredients/steps, deduplicates by source id AND title, and stores a DRAFT. It does not auto-publish or scrape external websites. Incomplete entries are skipped. A duplicate or invalid candidate can mean no import on a given day.

### Before turning on
1. Confirm your use complies with https://www.themealdb.com/terms_of_use.php and the documentation at https://www.themealdb.com/api.php .
2. Obtain a production-capable TheMealDB supporter key for your intended deployment. Use `pnpm exec wrangler secret put THEMEALDB_API_KEY` from apps/api.
3. Set unique high-entropy `ADMIN_SECRET` and `JWT_SECRET` as secrets. Rotate any default credentials previously deployed.
4. In the production Worker environment, set `AUTO_IMPORT_ENABLED=true`.
5. Apply D1 schema/migrations if deploying against a fresh database.
6. Review the unpublished draft in the existing admin interface; confirm source/license attribution, realistic time, clear steps, media rights, ingredient/allergen accuracy; **then manually publish**.

This is not a guarantee of new publicly visible recipes every day. A reliable daily publish requires a reviewed, licensed inventory queue and a publish policy.

## Next milestones
- Unified recipe schema with validated nutrition provenance, allergen ingredient links, cross-contact disclaimers, video source URL/license and locale.
- Non-LLM deterministic pantry ranking with substitutions, measured quantities and pantry expiry.
- Separate nutrition goals (cut/gain/maintain), with transparent calculations instead of unverified recipe macro estimates.
- Admin validation checklist, draft approval queue, metrics and retry/backoff; testing via CI and a real deployed smoke test.
- Multilingual i18n, localized Mongolian recipe names and image licensing.

## Safety
Never infer allergen-free status from missing tags. Never invent protein/calories. Guidance for loss of appetite should not replace healthcare evaluation for persistent symptoms or unintended weight loss. Online recipe photos/videos require licensed use or linking/embedding permission.
