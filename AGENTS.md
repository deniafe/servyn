# Servyn — Coding Agent Instructions

> **This file is the single entry point for every coding agent session.**
> Read this file FIRST, before writing any code, before opening any other file.
> This file overrides any training-data defaults or habits that conflict with it.

---

## 🎯 Your Role

You are building **Servyn**, a UK-focused, Afro-Caribbean services and African-products marketplace — one account with three role contexts (`customer` / `vendor` / `seller`) plus `admin`. It is a **pnpm + Turborepo** modular monolith (`apps/web` Next.js App Router deployed on Vercel `lhr1`, `apps/worker`, `apps/realtime`, `packages/*`) backed by Neon Postgres (Drizzle + PostGIS + pgvector), Clerk, Stripe Connect, Upstash Redis, Inngest, Cloudflare R2, Resend, Leaflet, PostHog (EU), Sentry, and Cloudflare Turnstile. You are NOT redesigning it. You are NOT proposing alternatives. You are implementing the architecture exactly as specified in the context files below.

---

## 📚 Mandatory Read Order (Every Session, No Exceptions)

Before writing a single line of code, read these files **in this exact order**:

### Phase 1: Current State (Where are we?)
1. **`context/06 - progress-tracker.md`** — Current phase, current unit, what's done, what's blocked, architectural decisions (`AD-NN`) made so far. **This is your starting point.**

### Phase 2: Architecture & Product (What are we building?)
2. **`context/01 - architecture-design.md`** — System architecture source of truth (web/worker/realtime topology, bounded modules, data model, payment & booking FSMs, SEO architecture, dual-role identity, validate-then-launch gates).
3. **`context/02 - project-overview.md`** — Product vision, dual-role continuity, marketplace categories, MVP core functionality, SEO constraints, pricing/fees, delivery priorities, safeguarding/GDPR/legal requirements.
4. **`context/page_inventory.md`** — Page surface, route groups, dialogs, sheets, popovers, and toasts per route.

### Phase 3: Standards (How do we build it?)
5. **`context/03 - code-standard.md`** — TypeScript strict mode, monorepo structure, API/server-action/Inngest/webhook contracts, database standards, SEO/maps standards, AI Match doctrine, App Router/component conventions, testing, error handling, logging, security/safeguarding checklist.
6. **`context/05 - ai-workflow-rules.md`** — Behavioral discipline (one unit at a time, read-before-write, verification sequence, module boundaries, server/client/worker/realtime split, money & SEO invariants).

### Phase 4: Domain-Specific (Conditional)
7. **`context/04 - ui-design-token.md`** — Complete Servyn design system: CSS custom property token definitions (`--sv-*`), Tailwind v4 `@theme inline` mapping, light-first palette (`cream` / `surface` / `leaf-900` brand surfaces / `gold`), typography (Fraunces + Inter), spacing, radius, elevation, motion, z-index scale. **Read in full if the current unit touches UI.**
8. **`context/ui-rules.md`** — UI layout rules and pattern constraints: container widths, header/footer, cards, brand surfaces, status pills, buttons, inputs, overlays, cultural motifs (kente/diamond), legal copy rules. **Read in full if the current unit touches UI.**
9. **`context/ui-registry.md`** — Living component registry and audited baseline: all components built so far with their exact class patterns. **Read before building any new component — match existing patterns first.**
10. **`context/build-plan.md`** & **`context/feature-specs/XX.md`** — The master build plan and the current unit's feature spec (e.g. `context/feature-specs/01.md`). **Read the current unit's spec in full before implementing.**

---

## 🗂️ File Locations

```
servyn/
├── AGENTS.md                                 ← You are here
├── context/
│   ├── 01 - architecture-design.md           ← System architecture
│   ├── 02 - project-overview.md              ← PRD & product vision
│   ├── 03 - code-standard.md                 ← Coding standards
│   ├── 04 - ui-design-token.md               ← Design system tokens (--sv-*)
│   ├── 05 - ai-workflow-rules.md             ← Behavioral discipline
│   ├── 06 - progress-tracker.md              ← Current state (read first)
│   ├── page_inventory.md                     ← Route groups & page surface
│   ├── ui-rules.md                           ← UI layout rules + pattern constraints
│   ├── ui-registry.md                        ← Living component registry & baseline
│   ├── build-plan.md                         ← Master feature build plan (all units)
│   └── feature-specs/                        ← Per-unit specs (01.md, 02.md, ...)
│
├── apps/
│   ├── web/                                  ← Next.js App Router (Vercel lhr1)
│   │   ├── app/
│   │   │   ├── (marketing)/                  ← Indexable SSR/ISR SEO pages
│   │   │   ├── (auth)/                       ← Sign-up / log-in / 2FA
│   │   │   ├── (onboarding)/                 ← Customer / vendor / seller wizards
│   │   │   ├── (customer)/                   ← Customer dashboard + booking flow + orders
│   │   │   ├── (vendor)/                     ← Vendor dashboard + calendar + services + earnings
│   │   │   ├── (seller)/                     ← Seller dashboard + products + orders
│   │   │   ├── (account)/                    ← Profile, security, notifications, privacy, GDPR
│   │   │   ├── (admin)/                      ← Admin console (MFA/SSO-gated)
│   │   │   ├── health/                       ← GET /health
│   │   │   └── api/                          ← Route handlers, webhooks, /api/inngest
│   │   └── inngest/                          ← Inngest client & function registry
│   ├── worker/                               ← CPU-bound Inngest steps (PDF/CSV exports, Sharp)
│   └── realtime/                             ← WebSocket chat gateway + Upstash pub/sub
│
├── packages/
│   ├── core/                                 ← Branded IDs, Result, AppError, Money, assertNever
│   ├── db/                                   ← Drizzle schema, migrations, postcodes/PostGIS/pgvector
│   ├── domain/
│   │   ├── identity/                         ← Clerk sync, dual-role, verification, safeguarding
│   │   ├── catalog/                          ← Categories, services, products, locations, SEO
│   │   ├── discovery/                        ← Search, filters, AI Match orchestration
│   │   ├── booking/                          ← Availability engine, slots, booking FSM, quotes
│   │   ├── payments/                         ← Stripe Connect, protected-payment FSM, fee engine
│   │   ├── disputes/                         ← Completion, evidence, resolution
│   │   ├── messaging/                        ← Conversations, chat, retention, moderation
│   │   ├── reviews/                          ← Ratings, moderation, trust signals
│   │   ├── commerce/                         ← Products, orders, bulk enquiries, fulfilment
│   │   ├── notifications/                    ← Resend/SMS/push fan-out, templates, preferences
│   │   ├── admin/                            ← Moderation, dispute console, config, analytics
│   │   └── gdpr/                             ← Data export, erasure, blockers, audit
│   ├── ai/                                   ← LLM provider abstraction, retrieval, grounding, consent
│   ├── realtime/                             ← WS gateway core + transport adapters
│   ├── ui/                                   ← Shared shadcn/ui + Servyn design-token primitives
│   ├── shared/                               ← Zod schemas, API DTOs, contracts, utils
│   └── observability/                        ← Structured logger, PII redactor, Sentry/PostHog
│
├── content/                                  ← MDX editorial & buying guides
├── tests/                                    ← Playwright E2E specs & fixtures
└── infra/
    └── terraform/                            ← Neon, Upstash, Cloudflare R2/DNS/TLS/WAF IaC
```

---

## 🔄 Your Workflow (Every Unit)

### Step 1: Identify the Current Unit
- Open `context/06 - progress-tracker.md`
- Find the first unit marked `TO DO` (not `IN PROGRESS`, not `COMPLETED`, not `BLOCKED`)
- Confirm all dependencies for that unit are satisfied (all prior non-blocked units are `COMPLETED`)

### Step 2: Mark Unit IN PROGRESS
- Update `context/06 - progress-tracker.md` **once at unit start** (no mid-unit updates):
  - Change the unit's status from `TO DO` to `IN PROGRESS`
  - Update the `Current Unit` field
  - Add a `Session Notes` entry describing what you're about to do

### Step 3: Read the Unit Spec
- Open `context/feature-specs/XX.md` (and the matching section in `context/build-plan.md`)
- Read it **in full**
- Understand:
  - What UI this unit establishes (mock data first, or wired)
  - What logic / services / packages to build
  - What files to create, move, or modify
  - What the manual testing checklist requires

### Step 4: Implement Exactly as Specified
- Create/modify files strictly as listed in the unit spec
- Build components/services/packages exactly as described
- Do NOT add features not mentioned in the spec
- Do NOT refactor unrelated code
- Do NOT create placeholder implementations for future units
- Do NOT leave TODOs without ticket references

### Step 5: Run Verification Sequence
Execute these commands in order — **all must exit 0**:
```bash
pnpm typecheck    # TypeScript check across all apps and packages
pnpm lint         # ESLint across all packages (including module boundary rules)
pnpm test         # Vitest unit/integration tests
pnpm build        # Production build for web, worker, and realtime
```
For units touching booking or payment money paths, also run Playwright E2E (`pnpm test:e2e`).

If any command fails, **fix the issue before proceeding**. Do not mark the unit as complete with failing checks.

### Step 6: Execute Manual Testing Checklist
- Open the unit's section in `context/feature-specs/XX.md`
- Execute every checklist item manually (or via browser/HTTP verification)
- Confirm all items pass
- Document any failures in Session Notes

### Step 7: Mark Unit COMPLETED
- Update `context/06 - progress-tracker.md`:
  - Change the unit's status from `IN PROGRESS` to `COMPLETED`
  - Add the unit to the `Completed Units` section with a summary of what it delivered
  - Update the `Current Unit` field to the next unit's ID
  - Add any Architectural Decisions made during the unit (numbered `AD-NN: decision — rationale`)
  - Add `Session Notes` describing what was implemented and any issues encountered
  - Update `Next Session Instructions` for the next unit

### Step 7B: Update User-Facing Documentation
When user-facing docs (`user-manual.md` / `user-manual-simple.md`) exist in the project, update them after completing each unit to reflect new user-visible capabilities (and note pure backend/infra changes in one line). Never leave manuals describing an older build than the one just completed.

### Step 8: Stop and Wait
- Do NOT start the next unit
- Do NOT implement more than one unit per session
- Wait for explicit confirmation to proceed

---

## 🚫 Forbidden Actions

### Architecture Violations
- ❌ Redesigning subsystems (web/worker/realtime topology, bounded modules, route groups, FSMs)
- ❌ Introducing new packages or processes not specified in `01 - architecture-design.md`
- ❌ Turning indexable `(marketing)` pages into client-rendered SPA shells, or using `router.push` instead of `<Link>` between catalog/vendor/product/guide pages
- ❌ Mutating booking or payment state outside `booking-fsm.ts` / `payment-fsm.ts` `transition()`
- ❌ Inline fee math (e.g. `price * 0.1`) instead of `computeFee(price, feeConfig, activeWaiver)`
- ❌ Using `setTimeout` or an in-request timer for the 48h auto-release (must be a delayed Inngest function)
- ❌ Creating a second Clerk account/login for vendor or seller mode (one Clerk user, role contexts in DB)
- ❌ Cross-importing between sibling `packages/domain/*` packages
- ❌ Provider adapters (`ai/providers/*`, `realtime/transports/*`, R2, email/SMS) importing from `packages/domain/*`
- ❌ Leaking `server-only` secrets into client bundles
- ❌ Disabling or bypassing validate-then-launch feature flags (`payments.protected_release`, `childcare.enhanced`, `accounting.mtd`) without signed-off validation

### Scope Violations
- ❌ Implementing two units in one session
- ❌ Starting Unit N+1 before Unit N is marked `COMPLETED`
- ❌ Mixing work from different units in the same commit
- ❌ Adding features not mentioned in the unit spec
- ❌ Refactoring unrelated code "while you're here"
- ❌ Creating placeholder implementations for future units
- ❌ Leaving TODOs without ticket references

### Code Quality Violations
- ❌ Using `any` (use `unknown` and narrow with `zod`, never `as` casts)
- ❌ Hardcoded hex colors in UI components (must use `--sv-*` CSS custom property tokens)
- ❌ Raw Tailwind color classes (`bg-green-900`, `text-amber-400`, `bg-white/[...]`, `bg-black/...`) — use project tokens only (`leaf-*`, `gold-*`, `cream`, `surface`, `ink`, `mut`, `line`)
- ❌ Adding a dark/light theme toggle (Servyn is light-first; `leaf-900`/`leaf-950` are brand surfaces)
- ❌ Putting borders on status pills (except `chip--gold` for paid/highlighted)
- ❌ Using floats for money (must use integer pence `*_minor` and the `Money` value object)
- ❌ Raw SQL outside `packages/db/` (must use typed repositories)
- ❌ Empty catch blocks or exposing raw error messages to users
- ❌ Bare `console.log` / `console.error` (must use structured logger in `packages/observability/`)
- ❌ Sending card numbers/CVC through our servers (Stripe.js / Elements only)
- ❌ Sending PII (addresses, phones, full names) to the AI Match LLM, or generating ungrounded AI reasons
- ❌ Using forbidden legal terminology: never write `"escrow"`, `"HMRC-approved"`, or `"Servyn certifies suitability"` anywhere in the UI or copy
- ❌ Building a new UI component without first checking `context/ui-registry.md` for an existing match
- ❌ Completing a UI unit without updating `context/ui-registry.md` with all new components built

### Process Violations
- ❌ Skipping units
- ❌ Combining units
- ❌ Implementing more than one unit per turn
- ❌ Not reading all context files in order before starting
- ❌ Updating `06 - progress-tracker.md` mid-unit (only at start and end)
- ❌ Not running the verification sequence (`typecheck`, `lint`, `test`, `build`)
- ❌ Not executing the manual testing checklist

---

## 🎯 Key Principles

### 1. UI-First Vertical Slices
Build full-page UI with seeded mock data first and verify visually before wiring backend logic. Every feature must be visible and testable before moving to the next.

### 2. SEO Is Structural, Not Cosmetic
Every indexable `(marketing)` page is server-rendered (SSR/ISR/SSG) with its own clean URL, real `<Link>` navigation, and truthful JSON-LD matching visible content.

### 3. Money Is a State Machine & Stripe Webhooks Are Authoritative
Booking and payment transitions flow through one `transition()` function each. Internal optimistic calls and Stripe webhooks converge on the same FSM. All amounts are integer pence (`Money`), all fees come from `computeFee()`, and the 48h auto-release is a durable Inngest delayed function.

### 4. One Account, Multiple Role Contexts
One Clerk user holds `customer`, `vendor`, `seller`, and `admin` contexts in our DB. Role switching changes active context, never login. Vendor/seller/admin routes require MFA.

### 5. Consent, Privacy & Safeguarding by Default
Cookie consent gates non-essential scripts (PostHog EU, map tiles). AI Match is consent-gated with a classic-search fallback. Childcare enhanced verification sits behind `childcare.enhanced` and states honestly what Servyn checks and does not certify.

### 6. Light-First Servyn Craft
Stick strictly to `--sv-*` tokens, Fraunces (display/headings/prices/stats) + Inter (UI/body), green-tinted shadows, `ui-registry.md` patterns, and disciplined legal copy (`"protected payment"`, `"downloadable records you can share with your accountant"`).

### 7. Validate-Then-Launch Discipline
Operational and legal gates (Servyn Ltd, ICO, NDAs/IP, Stripe Connect approval, protected-payment release timing, Clerk DPA) are tracked in `U05`. Never bypass a gate or enable a guarded feature flag to "unblock" a unit.

---

## 📝 Session Startup Checklist

Before writing any code, confirm you have:

- [ ] Read `context/06 - progress-tracker.md` and identified the current unit
- [ ] Read `context/01 - architecture-design.md`
- [ ] Read `context/02 - project-overview.md`
- [ ] Read `context/page_inventory.md`
- [ ] Read `context/03 - code-standard.md`
- [ ] Read `context/05 - ai-workflow-rules.md`
- [ ] Read `context/04 - ui-design-token.md` (if the unit touches UI)
- [ ] Read `context/ui-rules.md` (if the unit touches UI)
- [ ] Read `context/ui-registry.md` (if the unit touches UI — check existing patterns before building)
- [ ] Read `context/feature-specs/XX.md` and `context/build-plan.md` for the current unit in full
- [ ] Marked the unit `IN PROGRESS` in `context/06 - progress-tracker.md`

## 📋 Session Completion Checklist

Before marking a unit COMPLETED and stopping, confirm you have:

- [ ] All verification commands pass: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` (plus `pnpm test:e2e` for money paths)
- [ ] Manual testing checklist items in `context/feature-specs/XX.md` all pass
- [ ] `context/06 - progress-tracker.md` updated: status → `COMPLETED`, `AD-NN` logged, session notes written, next session instructions updated
- [ ] `context/ui-registry.md` updated with all new components (if unit touched UI)
- [ ] User-facing documentation updated (when present)

---

## 🚀 You Are Ready

Follow this file's instructions exactly. Read all context files. Identify the current unit. Read its spec. Implement exactly as specified. Verify. Update the tracker. Stop and wait.

**Do not redesign. Do not propose alternatives. Do not simplify. Implement the architecture as specified.**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
