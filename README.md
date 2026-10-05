# Ruhama

**দয়ায় গাঁথা হৃদয়, ঐক্যে গড়া উম্মাহ**

Ruhama is a Bangla Islamic knowledge and unity platform: articles reviewed by scholars (Ilm Center), respectful explanations of scholarly differences (ikhtilaf), moderated Q&A, structured courses with progress tracking, majlis events with registration, local circles, a video library with chapters, the Quran and the major hadith collections with search, and a moderated discussion forum. The whole interface is in Bangla.

This repository holds the complete application: the public site, member area, Payload CMS admin and a versioned REST API, in one Next.js app.

## Contents

- [Stack](#stack)
- [Quick start (local)](#quick-start-local)
- [Environment variables](#environment-variables)
- [Database, migrations and seed data](#database-migrations-and-seed-data)
- [Testing](#testing)
- [How it works](#how-it-works)
- [Deployment](#deployment) (Supabase, Cloudflare R2, OAuth, Turnstile, Resend, SMS, Vercel)
- [Project structure](#project-structure)

## Stack

| Concern            | Choice                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Next.js 16 (App Router), React 19, TypeScript strict                                                                               |
| CMS and admin      | Payload CMS 3 with the Postgres adapter, in the same app (`/admin`)                                                                |
| Database           | Supabase Postgres (pooled connection for the app, direct for migrations)                                                           |
| Auth               | Better Auth via `payload-auth`: one users table for members and staff. Google, Facebook, email and password, magic link, phone OTP |
| Media              | Cloudflare R2 through Payload's S3 adapter, served from a custom domain                                                            |
| UI                 | Tailwind CSS v4 with the design tokens from `design/ruhama.css`, Radix primitives, Lucide icons, `next/font`                       |
| Client state       | TanStack Query, nuqs (URL state), react-hook-form + zod, sonner                                                                    |
| Search             | Postgres full-text search + `pg_trgm` behind a `SearchService` interface (swappable for Meilisearch)                               |
| Live updates       | Supabase Realtime Broadcast (polling fallback when not configured)                                                                 |
| Email / SMS / bots | Resend, a Bangladeshi SMS gateway adapter, Cloudflare Turnstile                                                                    |
| Offline            | Serwist service worker: saved articles readable offline                                                                            |
| Tests              | Vitest (unit), Playwright + axe (end to end and accessibility)                                                                     |
| Hosting            | Vercel + Supabase + R2                                                                                                             |

## Quick start (local)

Requirements: Node.js 20.9 or newer (22 recommended) and PostgreSQL 15+ running locally (or a Supabase project).

```bash
npm install
```

```bash
cp .env.example .env
```

Fill in at least `DATABASE_URL`, `PAYLOAD_SECRET` and `BETTER_AUTH_SECRET` (any random string of 16+ characters, for example from `openssl rand -base64 32`). Everything else is optional locally: Turnstile uses Cloudflare's test keys, emails and SMS are written to `.outbox/`, and media is stored on disk.

Create the schema, load the demo content and (optionally) the Quran and hadith texts:

```bash
npm run migrate
```

```bash
npm run seed
```

```bash
npm run import:quran
```

```bash
npm run import:hadith
```

Start the app:

```bash
npm run dev
```

Open http://localhost:3000 for the site and http://localhost:3000/admin for the CMS. Every seeded account uses the password `Ruhama@2026` (or `SEED_PASSWORD`):

| Role                  | Account                                                |
| --------------------- | ------------------------------------------------------ |
| super admin           | admin@ruhama.local                                     |
| shura (final publish) | hakim@ruhama.local                                     |
| reviewers             | mahmudul@ruhama.local, imran@ruhama.local              |
| authors               | abdurrahman@ruhama.local, sumaiya@ruhama.local         |
| editor and moderator  | tanvir@ruhama.local, moderator@ruhama.local            |
| members               | abdullah@ruhama.local, fatima@ruhama.local, and others |

Seeded accounts are for development only. Never run the seed against production with the default password.

## Environment variables

Every variable is listed and explained in [`.env.example`](.env.example). In short:

| Group         | Variables                                                                                                                       | Needed                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Site          | `NEXT_PUBLIC_SITE_URL`                                                                                                          | always                                        |
| Database      | `DATABASE_URL`, `DATABASE_URL_DIRECT`, `DATABASE_POOL_MAX`                                                                      | always (direct URL for production migrations) |
| Secrets       | `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`, `CRON_SECRET`                                                                           | always (cron in production)                   |
| OAuth         | `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET`, `BETTER_AUTH_TRUSTED_ORIGINS`                                           | optional; buttons appear only when set        |
| Turnstile     | `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`                                                                        | required in production                        |
| SMS           | `SMS_PROVIDER`, `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER_ID`                                                                   | required in production for phone login        |
| Email         | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`                                                                                | required in production                        |
| Media         | `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_MEDIA_URL`, `NEXT_PUBLIC_IMAGE_TRANSFORMS` | required in production                        |
| Realtime      | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`                                        | optional (falls back to polling)              |
| Network       | `TRUSTED_IP_HEADER`                                                                                                             | only behind a proxy other than Vercel         |
| Dev and tests | `OUTBOX_DIR`, `SEED_PASSWORD`, `E2E_BASE_URL`                                                                                   | local only                                    |

Production fails closed where safety matters: without a Turnstile secret, registration and OTP requests are refused; without an SMS gateway, login codes are neither sent nor logged; without Resend, emails report an error instead of pretending to send.

Secrets live only in environment variables. Nothing secret is committed, and only `NEXT_PUBLIC_*` values reach the browser.

## Database, migrations and seed data

- The schema is managed by Payload migrations in `src/migrations` (schema push is disabled).
- `npm run migrate` applies pending migrations. It connects through `DATABASE_URL_DIRECT` when set, because transaction poolers do not support everything migrations need.
- After changing a collection, create a migration with `npm run migrate:create -- <name>`, review the generated SQL, commit it, then run `npm run generate:types` to refresh `src/payload-types.ts`.
- `npm run seed` loads the Bangla demo content from the design boards: articles, ikhtilaf topics, Q&A, courses, events, circles, videos, scholars, forum threads, pages and settings. It is idempotent (records are upserted by slug, email or key), so it can be re-run after content changes.
- `npm run import:quran` loads 114 surahs and 6,236 ayahs (Arabic: Tanzil simple text; Bangla: Muhiuddin Khan). `npm run import:hadith` loads Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Malik and Nawawi's 40 (Arabic and Bangla), with grades. Both are idempotent; downloads are cached in `.cache/datasets` (`-- --refresh` re-downloads). Attribution appears on every Quran and hadith page and on `/sources`.

## Testing

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm run test:unit
```

```bash
npm run test:e2e
```

End-to-end tests run against a seeded database. They reuse a running `npm run dev` (or start one), and need `OUTBOX_DIR` set on the server, because they read verification links, magic links and OTP codes from `.outbox/`. They cover:

- registration with email verification, sign-in by password, magic link and phone OTP, OAuth redirects (when keys are configured), and "sign out of all other devices";
- an article publishing only after two different reviewers approve, then appearing on cached public pages straight away (on-demand revalidation), and requested changes going back to the author;
- lesson completion and course progress (persisted, shown on the dashboard, undoable);
- guest and member event registration (Turnstile, seat counting, duplicate protection, calendar file, cancelling);
- the forum report flow (member report, moderator queue, hide and restore, automatic hiding at the report threshold);
- the video player (YouTube loaded only on play, chapters, `?t=` links);
- WCAG 2.1 A/AA checks with axe on every public page, in light and dark themes, on desktop and a phone viewport;
- offline reading of saved articles.

The offline tests need a production build, since the service worker is only registered there. To run everything against production locally:

```bash
npm run build
```

```bash
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3100 TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npx next start -p 3100
```

```bash
E2E_BASE_URL=http://localhost:3100 npm run test:e2e
```

(The Turnstile value above is Cloudflare's published always-pass test secret. The trusted-origin variable allows the auth API to be called from port 3100.)

Sign-in is rate limited (8 attempts per account per 15 minutes, plus per-IP limits). The test suite signs each seeded account in once per run (`tests/e2e/global-setup.ts`) and reuses that session, so normal repeated runs stay under the limits.

## How it works

**Rendering and caching.** Public pages are static (ISR). Data queries are wrapped in `unstable_cache` with tags per collection (`c:articles`), per document (`d:articles:<slug>`) and per global. Payload `afterChange`/`afterDelete` hooks call `revalidateTag`, so a publish appears within a request without a rebuild. Because every edit refreshes its own pages, time-based revalidation is only a safety net: one day for content, six hours for events, circles and the forum. The few things that change with the clock rather than an edit (the daily ayah and hadith, upcoming events and meetups) are refreshed by a second cron at Bangladesh midnight. This keeps ISR writes and database queries low, which matters on Vercel's free plan. Personal pages (dashboard, settings, notifications) render dynamically and stream. Filters live in the URL (nuqs) and are debounced; long lists use infinite scroll.

**Editorial workflow.** Articles, ikhtilaf topics and Q&A answers move through draft, in review, needs changes, approved and published. Publishing requires approvals from at least two different reviewers of the exact current text: approvals carry a content hash and are invalidated by later edits. The author can never approve their own work, and only shura or super admins publish. The rules live in `src/payload/workflow/logic.ts` and are enforced in the collection hook as well as the API, so neither the admin UI nor direct API calls can skip them. Every transition is written to the audit log and notifies the people involved.

**Roles and access.** `super_admin`, `shura`, `reviewer`, `editor`, `author`, `moderator`, `member`. Access is enforced at collection and field level in Payload, and checked again in every Server Action and route handler (`src/server/services/*`). Members cannot open `/admin`.

**Auth.** Better Auth handles sessions for both the site and the admin. Accounts link by verified email. Registration and OTP requests require Turnstile. Sign-in, OTP sending and verification are rate limited per identifier and per IP. Members can list their sessions and end one or all of them, which takes effect immediately (no session cookie cache).

**API.** A versioned REST API lives at `/api/v1/*`, with consistent error shapes. Its OpenAPI document is at `/api/v1/openapi.json`. The site's client components use the same API.

**Search.** `src/server/search` defines a `SearchService` interface. The Postgres implementation combines `tsvector` ranking with trigram similarity and highlights matches; a Meilisearch implementation can replace it without touching callers.

**Forum moderation.** New members' first posts, blocked terms, link-heavy or shouting text wait for a moderator. Reports auto-hide a post at a threshold (configurable under Moderation settings in the admin). Moderators work from `/forum/moderation`. Soft-deleted and removed posts leave a placeholder.

**Offline.** The Serwist worker (`src/sw/sw.ts`) precaches only the app shell (styles, fonts and icons, about 1.8 MB) and caches static assets at runtime. Pages, RSC payloads and API responses are never cached, so nothing personal stays on a shared phone. A signed-in member's saved articles are mirrored into a separate cache and removed on sign-out. Offline, saved articles open normally; any other page shows an offline screen that lists them.

**Security.** A Content Security Policy and the other security headers come from `src/lib/security-headers.ts`, with `upgrade-insecure-requests` and HSTS on HTTPS deployments. Server-side checks run on every mutation. Rate limits use the client IP from trusted proxy headers only (`src/lib/client-ip.ts`). Admin actions are audited.

**SEO and accessibility.** Pages have metadata, canonical URLs and JSON-LD (Article, QAPage, Course, Event, VideoObject, DiscussionForumPosting, breadcrumbs). There is a sitemap index with per-type sitemaps (including every surah and hadith page), `robots.txt`, and Open Graph images rendered with Bangla fonts. The document uses `lang="bn"`, and Arabic is marked `lang="ar" dir="rtl"`. Pages are checked against WCAG 2.1 AA and honour reduced motion.

## Deployment

The production setup is Vercel (app), Supabase (Postgres and Realtime) and Cloudflare R2 (media). The order below avoids chicken-and-egg problems.

### 1. Supabase

1. Create a project at supabase.com in **Southeast Asia (Singapore) `ap-southeast-1`**: the best route from Bangladesh, and the same city as the Vercel functions (`sin1`).
2. Click **Connect** at the top of the project:
   - copy the **Transaction pooler** URI (port 6543) into `DATABASE_URL`;
   - copy the **Session pooler** URI (port 5432) into `DATABASE_URL_DIRECT`. Avoid "Direct connection": it is IPv6-only and fails from many networks and from Vercel.
     Replace `[YOUR-PASSWORD]` with the database password. Prefer a password of letters and digits; otherwise URL-encode it (`/` becomes `%2F`).
3. Under **Project Settings > API**, copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`, the `anon` key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` and the `service_role` key into `SUPABASE_SERVICE_ROLE_KEY` (secret: server only).
4. Run the migrations and imports once from your machine with those values in `.env`:

```bash
npm run migrate
```

```bash
npm run import:quran
```

```bash
npm run import:hadith
```

The migrations also lock Supabase's public Data API: the `anon` and `authenticated` roles get no table access and row-level security is enabled on every table, because the anon key is public and the app never uses that API (`src/migrations/20261006_000000_supabase_lockdown.ts`).

Then create the first super admin. Either run the seed against a staging database only, or register normally on the deployed site and give that account the `super_admin` role in the `users` table (Supabase table editor, `users_role`), then manage everyone else from `/admin`.

### 2. Cloudflare R2 (media)

1. In the Cloudflare dashboard go to **R2 > Create bucket** (for example `ruhama-media`).
2. Under **Settings > Custom Domains**, connect a subdomain such as `media.your-domain`. Put it in `NEXT_PUBLIC_MEDIA_URL`.
3. Under **R2 > Manage R2 API tokens**, create a token with Object Read & Write on that bucket. Put the Access Key ID and Secret in `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`, the bucket name in `R2_BUCKET` and `https://<account-id>.r2.cloudflarestorage.com` in `R2_ENDPOINT`.
4. Optional but recommended: in your domain's Cloudflare dashboard open **Images > Transformations** and enable it for the zone, then set `NEXT_PUBLIC_IMAGE_TRANSFORMS=cloudflare`. Images in articles are then resized and converted (WebP/AVIF) at the edge for each screen size, instead of by Vercel's image optimizer, whose free plan has a monthly limit. `next/image` is configured with the same loader (`src/lib/image-loader.ts`), so it never uses the Vercel optimizer.

### 3. Sign-in providers (optional)

- **Google:** Google Cloud Console > APIs & Services > Credentials > Create OAuth client ID (Web application). Authorised JavaScript origin: your site URL. Redirect URI: `https://your-domain/api/auth/callback/google`.
- **Facebook:** developers.facebook.com > Create app > Facebook Login > Settings. Valid OAuth redirect URI: `https://your-domain/api/auth/callback/facebook`. Switch the app to Live mode.

Set the client ID and secret. The buttons appear automatically.

### 4. Turnstile, Resend and SMS

- **Turnstile:** Cloudflare > Turnstile > Add site (Managed) for your domain. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
- **Resend:** verify your sending domain (DNS records), create an API key and set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that domain).
- **SMS:** with an account at a Bangladeshi bulk-SMS provider whose HTTP API matches `src/server/sms/index.ts` (BulkSMSBD-style), set `SMS_PROVIDER=bd_gateway`, `SMS_API_URL`, `SMS_API_KEY` and an approved `SMS_SENDER_ID`. Any other gateway can be added by implementing the small `SmsProvider` interface.

### 5. Vercel

1. Import the repository into Vercel (framework preset: Next.js). `vercel.json` pins the server functions to Singapore (`regions: ["sin1"]`), next to the database; keep **Settings > Functions > Function Region** on Singapore too. Without this Vercel runs functions in Washington (`iad1`) and every database query would cross the Pacific. Vercel runs `npm run vercel-build`, which applies pending migrations on production deploys (over `DATABASE_URL_DIRECT`) and then builds. Preview deploys skip migrations; point previews at a separate database (a Supabase branch) if they need schema changes.
2. Add every variable from `.env.example` under **Settings > Environment Variables**: `NEXT_PUBLIC_SITE_URL=https://your-domain`, both database URLs, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`, `CRON_SECRET` and the service keys above. Leave `OUTBOX_DIR`, `SEED_PASSWORD` and `E2E_BASE_URL` unset. For preview URLs, add them to `BETTER_AUTH_TRUSTED_ORIGINS`.
3. Deploy, then add your domain under **Settings > Domains**.
4. `vercel.json` defines two daily cron jobs: `/api/v1/cron/daily` (event reminders, purging accounts after the 30-day deletion grace period, housekeeping) and `/api/v1/cron/refresh` at Bangladesh midnight (refreshes the date-dependent pages). Vercel sends `CRON_SECRET` automatically. Both fit the free plan's once-a-day limit.

After the first deploy, check:

- `/admin` signs in with your super admin account;
- uploading an image stores it under your media domain;
- registering sends a verification email;
- phone login receives an SMS;
- publishing an article shows it on `/ilm` straight away;
- `/sitemap.xml` and `/robots.txt` use your domain.

## Project structure

```
design/                 the 49 design boards and ruhama.css (visual source of truth)
scripts/                seed, Quran and hadith importers, icon generator, Vercel build
src/app/(frontend)/     public site, auth pages and member area (App Router)
src/app/(payload)/      Payload admin and its REST routes
src/actions/            thin Server Actions (validate, call a service, revalidate)
src/components/         UI by feature (forum, learning, events, scripture, ...)
src/hooks/              client hooks (lists, learning progress, realtime, ...)
src/lib/                shared helpers: formatting, roles, validation schemas, security headers
src/payload/            collections, globals, access rules, workflow, hooks, /api/v1 endpoints
src/server/             services (business rules), queries, auth, search, email, SMS, OG images
src/sw/                 service worker and its message protocol
src/migrations/         database migrations
tests/unit/             Vitest
tests/e2e/              Playwright specs, helpers and global setup
```
