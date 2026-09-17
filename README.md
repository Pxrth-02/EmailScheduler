# Email Scheduler

A small slice of what a cold-email platform does under the hood: schedule emails to go out at a
given time from several sender identities, throttle them per sender, keep every promise across
restarts, and give the user a dashboard to compose and track it all.

Built for the ReachInbox full-stack assignment.

## Contents

- [Stack](#stack)
- [Running it](#running-it)
  - [Infrastructure](#1-infrastructure)
  - [Backend](#2-backend-api-and-worker)
  - [Frontend](#3-frontend)
  - [Ethereal, Google and Slack setup](#ethereal-google-and-slack-setup)
  - [Environment variables](#environment-variables)
- [Architecture](#architecture)
  - [How scheduling works](#how-scheduling-works)
  - [How persistence on restart works](#how-persistence-on-restart-works)
  - [How rate limiting and concurrency work](#how-rate-limiting-and-concurrency-work)
  - [Search](#search)
- [Features](#features)
- [Demo walkthrough](#demo-walkthrough)
- [Deploying](#deploying)
- [Assumptions, shortcuts and trade-offs](#assumptions-shortcuts-and-trade-offs)

## Stack

| Layer    | Choice                                                                                                         |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| Backend  | Node 22, TypeScript, Express 5, Prisma 7 on MySQL 8, BullMQ 6 on Redis, Nodemailer + Ethereal, Elasticsearch 9 |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, React Router 8, TanStack Query 5, Tiptap 3                       |
| Infra    | Docker Compose for MySQL, Redis (AOF on) and Elasticsearch; the API and worker run as two Node processes       |

## Running it

Prerequisites: Node 22.22 or newer, Docker, and a Google OAuth client (see below).

### 1. Infrastructure

```bash
docker compose up -d
```

Starts MySQL 8.4 on `3306`, Redis 8 on `6379` with append-only persistence, and a single-node
Elasticsearch 9.5 on `9200` (security disabled, 512 MB heap). Elasticsearch is optional: leave
`ELASTICSEARCH_URL` empty and search falls back to SQL.

### 2. Backend (API and worker)

```bash
cd backend
cp .env.example .env            # fill in SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
npm install                     # also generates the Prisma client (postinstall)
npx prisma migrate dev --name init   # creates the tables; run `npx prisma generate` if you ever change the schema
npm run dev:all                 # API on :4000 and the worker, side by side
```

Or run them in two terminals with `npm run dev` (API) and `npm run worker`. Production builds with
`npm run build`, then `npm start` and `npm run start:worker`.

Useful URLs once it is up:

- `GET http://localhost:4000/health` – MySQL and Redis probes, 503 when either is down
- `http://localhost:4000/admin/queues` – live BullMQ dashboard (Bull Board), needs a logged-in session

Other scripts: `npm test` (unit tests; the rate-limiter tests need a reachable Redis),
`npm run load-test -- --user you@example.com --count 1000 --cleanup` (plans a 1,000-recipient
campaign and prints the per-hour layout), `npm run reindex` (rebuilds the search index).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                     # http://localhost:5173
```

The dev server proxies `/api`, `/auth` and `/health` to the backend, so the session cookie is
first-party and no CORS configuration is needed in development. `npm run build` produces static
files in `dist/` to be served from the same origin as the API.

### Ethereal, Google and Slack setup

**Ethereal** needs no setup. On a user's first login the backend calls
`nodemailer.createTestAccount()` `SENDERS_PER_USER` times and stores each account as a sender, so
every user gets several "From" identities. Every sent email stores its Ethereal preview URL, shown
in the dashboard as "Open the delivered message in Ethereal". To pin one account you created on
ethereal.email yourself, set `ETHEREAL_USER` and `ETHEREAL_PASS`.

**Google login.** In Google Cloud Console go to APIs & Services → Credentials → Create credentials →
OAuth client ID → Web application. Add `http://localhost:5173` as an authorized JavaScript origin
and `http://localhost:4000/auth/google/callback` as an authorized redirect URI. Configure the OAuth
consent screen as External and add your own account under test users. Put the client id and
secret in `backend/.env`.

**Slack.** Rate-limit alerts are delivered through a Slack app installed per user with OAuth v2.
At api.slack.com create an app (from scratch), open OAuth & Permissions, add `incoming-webhook`
under Bot Token Scopes, and register a redirect URL. Slack only accepts HTTPS redirect URLs, so in
local development the callback has to arrive through a tunnel: sign up at ngrok.com (free), claim
the free static domain under Domains, and run `ngrok http --url=<name>.ngrok-free.app 4000`. Use
`https://<name>.ngrok-free.app/slack/oauth/callback` both as the redirect URL in Slack and as
`SLACK_REDIRECT_URI`; copy the Client ID and Client Secret from Basic Information into
`backend/.env`. Only that one callback request travels through the tunnel: the install starts from
the dashboard on localhost, and the callback identifies the user through a one-time `state` token
kept in Redis rather than through the session cookie (which the browser would not send to the
tunnel host), then redirects back to `FRONTEND_URL`. "Connect Slack" in the user menu runs the
flow and stores the webhook per user; "Disconnect Slack" deletes it. Until the three `SLACK_*`
variables are set the menu item is shown disabled, and rate-limit hits are logged but not posted.

### Environment variables

All backend variables are validated with zod at boot; a missing or malformed value is a startup
error, not a runtime surprise. Real `.env` files are git-ignored; only the `.env.example` files are
committed.

| Variable                                             | Default                                      | Purpose                                                                   |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`                                       | `mysql://root:root@localhost:3306/…`         | MySQL connection (root locally so `migrate dev` can create its shadow DB) |
| `REDIS_URL`                                          | `redis://localhost:6379`                     | Queue, sessions, rate-limit counters                                      |
| `FRONTEND_URL` / `API_URL`                           | `http://localhost:5173` / `…:4000`           | CORS origin, post-login redirect, OAuth callbacks                         |
| `SESSION_SECRET`                                     | —                                            | Signs the session cookie (32+ chars)                                      |
| `GOOGLE_CLIENT_ID` / `_SECRET`                       | —                                            | Google OAuth client                                                       |
| `GOOGLE_CALLBACK_URL`                                | `http://localhost:4000/auth/google/callback` | Must match the console                                                    |
| `WORKER_CONCURRENCY`                                 | `5`                                          | Jobs in flight per worker process                                         |
| `JOB_ATTEMPTS` / `JOB_BACKOFF_MS`                    | `3` / `30000`                                | Retries with exponential backoff for SMTP errors                          |
| `SENDERS_PER_USER`                                   | `3`                                          | Ethereal accounts created per user                                        |
| `ETHEREAL_USER` / `ETHEREAL_PASS`                    | —                                            | Optional pinned Ethereal account                                          |
| `MIN_DELAY_BETWEEN_EMAILS_MS`                        | `2000`                                       | Floor for the gap between sends from one sender                           |
| `MAX_EMAILS_PER_HOUR_PER_SENDER`                     | `200`                                        | Ceiling for one sender's emails per wall-clock hour                       |
| `SLACK_CLIENT_ID` / `_SECRET` / `SLACK_REDIRECT_URI` | —                                            | Slack app; all three required to enable the integration                   |
| `ELASTICSEARCH_URL` / `_INDEX` / `_API_KEY`          | `http://localhost:9200` / `emails` / —       | Search; leave URL empty to use the SQL fallback                           |
| `VITE_API_URL` (frontend)                            | `http://localhost:4000`                      | Dev-server proxy target                                                   |

## Architecture

```
frontend/   React SPA (Vite)  ──cookie session──▶  backend/src/server.ts   Express API
                                                        │  Prisma            ▼
                                                        │              MySQL (source of truth)
                                                        │  BullMQ addBulk    ▲
                                                        ▼                    │ compare-and-set
                                                  Redis (delayed jobs, sessions, counters)
                                                        │
                                                        ▼
                                                  backend/src/worker.ts  BullMQ worker ──SMTP──▶ Ethereal
                                                        │                                  └──▶ Slack webhook
                                                        ▼
                                                  Elasticsearch (search index)
```

Two processes share one codebase. The API only ever writes rows and enqueues jobs; the worker
only ever sends. Either can be restarted or scaled without the other noticing.

Backend layout (`backend/src`): `config/env.ts` (zod-validated settings), `lib/` (Prisma, Redis,
logger), `middleware/` (auth guard, validation, error handler), `modules/auth` (Google code flow,
sessions, email+password), `modules/senders` (Ethereal provisioning), `modules/campaigns` (create,
plan, enqueue), `modules/emails` (lists, counts, detail), `modules/queue` (queue, processor,
status transitions, reconciler), `modules/throughput` (Redis slot reservation),
`modules/slack`, `modules/search`, `modules/admin` (Bull Board).

Data model: `users` → `senders` (one Ethereal account each) → `campaigns` (subject, body, start
time, delay, hourly limit) → `emails` (one row per recipient with status
`scheduled | sending | sent | failed`, scheduled/sent times, attempts, message id, preview URL,
last error). `slack_connections` holds one webhook per user. Primary keys are UUIDv7 so they
stay time-ordered in InnoDB.

### How scheduling works

`POST /api/campaigns` receives the subject, body, recipient list, sender, start time, delay and
hourly limit. It

1. de-duplicates recipients and clamps the request to the system limits
   (`delay = max(requested, MIN_DELAY_BETWEEN_EMAILS_MS)`,
   `hourlyLimit = min(requested, MAX_EMAILS_PER_HOUR_PER_SENDER)`);
2. **plans** a send time per recipient: recipient _i_ goes at `start + i·delay`, and whenever an
   hour window already holds `hourlyLimit` emails the sequence jumps to the start of the next hour
   (`modules/scheduling/schedule-plan.ts`, pure and unit-tested);
3. inserts the campaign and all email rows in one transaction, in chunks of 500;
4. enqueues one **BullMQ delayed job per email** with a single `addBulk`, `delay = scheduledAt −
now`, and `jobId = email-<rowId>`.

There is no cron and no polling loop in the code. BullMQ keeps delayed jobs in a Redis sorted set
scored by timestamp; the worker's blocking loop wakes when the earliest one is due and moves it to
active atomically. 1,000 recipients cost one round trip to MySQL and one to Redis
(`npm run load-test` shows 1,000 rows and jobs written in well under a second, laid out as
200/hour for five hours at the defaults).

### How persistence on restart works

Nothing about _when_ lives in process memory. The schedule exists in two places that can rebuild
each other: BullMQ's delayed set in Redis (persisted with AOF, `appendfsync everysec`) and the
`scheduled_at` column in MySQL.

- **API restart:** nothing to do; the API holds no schedule state.
- **Worker restart:** delayed jobs are still in Redis and fire on time. `worker.close()` on
  SIGTERM waits for in-flight sends, so a graceful restart never abandons a half-sent email.
- **Redis lost data:** on boot the worker runs a **reconciler** (`modules/queue/reconciler.ts`)
  that walks every `scheduled` row and re-adds any job that is missing. Because the job id is
  derived from the row id, re-adding a job that still exists is a no-op, so this is safe to run on
  every start.
- **Worker killed mid-send:** rows left in `sending` for more than five minutes are inspected; if
  their job is gone they are marked `failed` with an "interrupted" reason rather than re-sent,
  because SMTP may already have accepted the message.

Emails are never sent twice because every status change is a **compare-and-set** on the row
(`UPDATE emails SET status='sending' WHERE id=? AND status='scheduled'`). Only the worker that
sees one affected row continues to SMTP; a duplicate delivery, a second worker, or a job that ran
after a manual change all see zero rows and stop. Restart-and-verify is part of the demo below.

### How rate limiting and concurrency work

Three controls, all configurable through env and all enforced in Redis so they hold across any
number of worker processes:

| Control                     | Setting                                | Enforcement                                                                                                       |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Worker concurrency          | `WORKER_CONCURRENCY` (5)               | BullMQ `Worker({ concurrency })`; safe because every job begins with the compare-and-set claim                    |
| Minimum delay between sends | `MIN_DELAY_BETWEEN_EMAILS_MS` (2 s)    | Planned at enqueue; enforced at send by the per-sender "next free slot" in Redis                                  |
| Emails per hour, per sender | `MAX_EMAILS_PER_HOUR_PER_SENDER` (200) | Redis counters keyed `rl:sender:<id>:<hourWindowStart>`, plus a per-campaign counter for the campaign's own limit |

The chosen minimum delay is **2 seconds between sends from the same sender** (the compose form can
ask for more, never less).

At send time the worker calls one Lua script (`modules/throughput/slot-reservation.ts`) that
atomically: takes the later of "now" and the sender's next free time; finds the first hour window
from there in which both the sender counter and the campaign counter are under their caps;
increments those counters; advances the sender's next free time by the gap; and returns the slot.
If the slot is more than half a second away, the worker puts the row back to `scheduled` with the
new time, records the reserved slot on the job, and calls `job.moveToDelayed(slot)` +
`throw new DelayedError()`, the BullMQ-sanctioned way to postpone from inside a processor without
counting a failure. When the job wakes at its slot it sends without reserving again.

Consequences: emails are never dropped or failed for hitting a limit, only moved to the next
available window; order is preserved because reservations are taken in arrival order and each one
advances the sender's next slot; two workers can never both see "199" and both send, because the
read-check-increment is a single Lua call; and a backlog after downtime trickles out at exactly
the configured gap instead of bursting. BullMQ's built-in `limiter` was not used because it is
per queue, and the brief asks for per-sender limits with several senders.

**Slack.** The first job in a window that finds the window full does `SET NX` on
`slack:notified:<sender>:<window>`; only that job posts to the user's webhook, so one full hour
produces one message even with many workers. No connection stored means no call and no error;
connecting later works immediately because the webhook is read on each hit.

### Search

Every status change re-indexes the email in Elasticsearch (subject, body text, recipient, sender,
status, times; `dynamic: strict` mapping with an email-aware analyzer so "sarah" finds
sarah.wilson@…). The search bar queries Elasticsearch scoped to the current user and tab, gets
ranked ids back, and hydrates rows from MySQL so results look identical to the plain list. If the
cluster is unconfigured or down the same query runs as SQL `LIKE`s; the search bar degrades, it
never breaks.

## Features

**Backend**

- Scheduler: `POST /api/campaigns`, per-recipient plan, BullMQ delayed jobs, deterministic job ids, no cron
- Persistence: Redis AOF, boot-time reconciler, compare-and-set transitions, graceful shutdown, interrupted-send detection
- Rate limiting: configurable min delay and per-sender hourly cap, per-campaign cap, atomic Redis reservation, reschedule-not-drop, order preserved
- Concurrency: `WORKER_CONCURRENCY`, several worker processes supported
- Multiple senders: Ethereal accounts provisioned per user, one pooled transport per sender
- Retries: exponential backoff, `failed` with the last error after the final attempt
- Slack: real OAuth v2 install, webhook stored per user, live message on limit hit, disconnect, no-op when not connected
- Search: Elasticsearch indexing and query, MySQL fallback, reindex script
- Live queue dashboard: Bull Board at `/admin/queues` behind the session
- Auth: real Google OAuth (authorization code + verified ID token), Redis-backed sessions, email+password as on the design, logout
- API hygiene: zod validation, typed errors, pino logging, health probes with timeouts, helmet, CORS

**Frontend**

- Login page per the Figma (Google + email/password), `?error=google` handling
- Dashboard shell: sidebar with logo, user card (name, email, avatar) and menu (Connect Slack, Logout), Compose, Scheduled and Sent with live counts
- Scheduled and Sent lists: recipient, status badge (with time for scheduled), bold subject, preview, sender filter, refresh, search with 300 ms debounce, load-more paging, 5 s live refresh
- Loading skeletons, empty states, error toasts everywhere data loads
- Email detail view per the Figma, sanitized HTML body, failure reason, Ethereal preview link
- Compose per the Figma: From dropdown, To chips with "+N" overflow, typed or pasted addresses, CSV/TXT upload with detected-count toast, Subject, delay and hourly limit, Tiptap editor with the toolbar, Send Later popover with presets and a date-time picker
- Reusable UI: Button, IconButton, Input, Badge, Avatar, Popover, MenuItem, Skeleton, EmptyState, Spinner
- Typed API layer (`types/api.ts`, `lib/api.ts`), TanStack Query hooks per feature, lazy-loaded compose chunk

## Demo walkthrough

1. `docker compose up -d`, then `npm run dev:all` in `backend/` and `npm run dev` in `frontend/`.
2. Log in with Google. The header shows your name, email and avatar; the sidebar shows 0 / 0.
3. Compose → upload a CSV of leads (a count toast appears) → subject and body → delay `2`,
   hourly limit `100` → clock icon → "Now" → Done → Send. A toast confirms the count and first
   send time and the Scheduled tab fills up with amber time badges.
4. Watch rows move to Sent every 2 seconds; open one and click the Ethereal preview link.
5. Open `http://localhost:4000/admin/queues` to see the delayed, active and completed jobs live.
6. **Restart:** schedule a campaign a minute out, stop the worker (Ctrl-C, or `kill -9` it), wait
   past the send time, start it again. The reconciler logs what it checked, the emails go out, and
   the Sent tab shows each recipient exactly once.
7. **Rate limit:** set `MAX_EMAILS_PER_HOUR_PER_SENDER=3` in `backend/.env` and restart the API
   and worker. Schedule 3 emails from one sender; they go out two seconds apart and fill that
   sender's hour. Now schedule 2 more from the same sender: the plan expects room in the current
   hour, the worker finds the window full, moves both to the top of the next hour (their badges
   jump forward and the worker logs "hourly limit reached, postponing to next window") and, with
   Slack connected, one message arrives in the channel. A single larger campaign does not trigger
   the alert, because the planner already lays it out within the limit; the alert is for capacity
   consumed by other campaigns or workers. It is sent once per sender per hour window, so to repeat
   the demo inside the same hour pick another From sender or run `redis-cli FLUSHALL`.
8. `npm run load-test -- --user you@example.com --count 1000 --cleanup` prints the five-hour layout
   for 1,000 recipients.

## Deploying

Hosting is not part of the brief, but the repo is ready for it and nothing in the code is tied to
a provider. Two pieces make that possible:

- `Dockerfile` builds the React app and the API into one image. In production the API serves the
  built frontend itself (`STATIC_DIR`), so the browser talks to a single origin: no CORS, a
  first-party session cookie, OAuth callbacks and Bull Board on the same host. The same image runs
  the worker with `node dist/worker.js`.
- `docker-compose.prod.yml` runs the whole stack on one Linux host: MySQL, Redis (AOF on,
  `noeviction`), optional Elasticsearch, the API, the worker, and Caddy, which obtains and renews
  an HTTPS certificate automatically. Only ports 80 and 443 are exposed.

### One host with Docker Compose (any VPS or free-tier VM)

Works the same on any provider that gives you a Linux VM with a public IP: Oracle Cloud's always-free
ARM instance, AWS or GCP free-tier credits, DigitalOcean, Hetzner, Linode. Use at least 2 GB of RAM,
4 GB if you enable Elasticsearch.

1. Create an Ubuntu 24.04 VM and open inbound ports 22, 80 and 443.
2. Point a hostname at its public IP: a subdomain of a domain you own, or a free one from a
   dynamic-DNS service such as DuckDNS. Caddy needs a real hostname to issue the certificate.
3. On the VM, install Docker and get the code:

   ```bash
   curl -fsSL https://get.docker.com | sh
   git clone <your-private-repo-url> emailscheduler && cd emailscheduler
   ```

4. Create the production env file and fill it in (domain, database passwords, session secret,
   Google client, Slack app):

   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```

5. Build and start everything (add `--profile search` to include Elasticsearch):

   ```bash
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
   docker compose -f docker-compose.prod.yml --env-file .env.production logs -f api worker
   ```

   The `api` container runs `prisma migrate deploy` before starting, so the schema is created on
   first boot and upgraded on later deploys.

6. In the Google OAuth client add `https://<your-domain>` as an authorized JavaScript origin and
   `https://<your-domain>/auth/google/callback` as a redirect URI. For Slack, add
   `https://<your-domain>/slack/oauth/callback` to the app's redirect URLs; Caddy already
   provides the HTTPS Slack requires, so no tunnel is needed.
7. Open `https://<your-domain>/health`, then log in. To redeploy after a push:
   `git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`.

Restart demo in production: `docker compose -f docker-compose.prod.yml kill worker` mid-campaign,
then `... up -d worker`; the reconciler logs what it checked and the remaining emails go out once.

### A container platform instead

Any platform that builds a `Dockerfile` (Railway, Render, Fly.io, Koyeb, Cloud Run and the like)
can run the image as two services from the same repository: the API with the default command and a
public HTTPS domain, and the worker with the start command `node dist/worker.js`. Provide MySQL 8
and Redis (with `maxmemory-policy noeviction` and AOF persistence) from the platform or from managed
providers such as Aiven for MySQL and Redis Cloud, run `npx prisma migrate deploy` as the release or
pre-deploy step, and set the same variables as in `.env.production.example` with
`DATABASE_URL` and `REDIS_URL` pointing at those services. Two things to check on free tiers: the
worker must not be a service that sleeps when idle, or scheduled emails will not go out; and the
frontend must stay on the API's origin (which the image guarantees) or be proxied to it, otherwise
the session cookie and OAuth callback break.

## Assumptions, shortcuts and trade-offs

- **Hour windows are wall-clock UTC hours**, not sliding 60-minute windows. This makes the counter
  key and the "next available window" obvious and cheap; the cost is a burst of up to
  `2 × limit` across a boundary, which is how most providers count anyway.
- **Interrupted sends are marked failed, not retried.** If a worker dies between SMTP accepting
  the message and MySQL recording it, the row is surfaced as failed with a clear reason. Re-sending
  would risk a duplicate to a real inbox; an outbox table or a provider message-id lookup would
  close this gap in production.
- **The per-sender gap is the system floor, not the campaign's delay.** A campaign's own spacing
  is guaranteed by its plan; the Redis gap protects other campaigns on the same sender from being
  slowed down by a campaign that asked for a large delay.
- **Ethereal credentials are stored in plain text** because they are throwaway test accounts. A
  real system would encrypt `smtp_pass` with a KMS-managed key.
- **The Prisma migration is generated on the developer's machine** with `prisma migrate dev`
  against the Docker MySQL, then committed.
- **Elasticsearch is optional at runtime.** The brief asks for it and it is fully wired, but search
  degrades to SQL when the cluster is absent so the rest of the app never depends on a 1 GB JVM.
- **Attachments, cancelling a scheduled email, and per-recipient templating** are out of scope;
  the paperclip, star, archive and trash icons from the design are rendered but disabled.
- **Sessions use a 50-line ioredis store** instead of connect-redis, which targets the node-redis
  client; one Redis library in the project was preferable to two.
- **Email + password login** is implemented because the design shows it; the brief only requires
  Google. Passwords are bcrypt-hashed, and a wrong email and a wrong password return the same error.
