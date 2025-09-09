# 🌍 Circles – Design Document
*Living document – updated as the project evolves*

> **Owner:** @you  
> **Status:** Draft → Living  
> **Last updated:** <!-- YYYY-MM-DD -->

## 1) Vision & Purpose
Circles helps digital nomads, travelers, and networkers capture, organize, and enrich the contacts they meet across contexts (conferences, co-working spaces, trips, events).

Users can:
- **Group people** into categories (events, locations, activities)
- **Enrich info** via online sources and integrations
- **Recall contacts contextually** when traveling or attending events

This doc is the **northern star** for architecture, roadmapping, and feature planning.

## 2) Target Platforms
- **Web App** – responsive dashboard
- **iOS** – mobile companion, on-the-go capture
- **Android** – mobile companion, parity features

## 3) Core Principles
- **Seamless Capture** – quick add (QR, badge scan, short note)
- **Contextual Recall** – surface the right people in the right place/time
- **Cross-Platform Sync** – consistent data, offline-first on mobile
- **Smart Enrichment** – optional, user-controlled
- **Privacy First** – user owns data; explicit consent for enrichment

## 4) Tech Stack (Proposal)
- **Frontend:** React Native (iOS/Android), React (Web)
- **Backend:** Node.js + Express (or NestJS)
- **DB:** PostgreSQL
- **Auth:** OAuth 2.0 / OIDC (Google, LinkedIn, Apple) + email
- **Hosting:**
  - Web → Vercel
  - API → Railway / AWS / GCP
  - DB → Supabase / RDS
- **Integrations (future):** LinkedIn, Google Contacts, HubSpot, Calendars

## 5) Architecture Overview
See `/docs/ARCHITECTURE_OVERVIEW.mmd` for the Mermaid diagram (rendered in README/Docs site).

**High-level:**
- Clients (Web, iOS, Android) call a REST API
- API handles auth, business logic, enrichment workers
- PostgreSQL stores contacts, groups, tags, activity
- Background jobs for enrichment & geo-events
- Push/email notifications via provider(s)

## 6) Data Model (Draft)
- **User**: id, email, name, settings
- **Contact**: id, user_id, name, company, role, email(s), phone(s), notes, social_links, last_interacted_at, created_at, updated_at
- **Group**: id, user_id, name, type (event|location|custom), metadata(jsonb)
- **ContactGroup**: contact_id, group_id
- **Tag**: id, user_id, name
- **ContactTag**: contact_id, tag_id
- **EnrichmentJob**: id, user_id, contact_id, provider, status, payload, created_at, updated_at

*(jsonb fields allow flexible enrichment metadata.)*

## 7) MVP Feature Set
- **Auth & Accounts:** email + OAuth; profile settings
- **Contact Capture:** manual entry; quick add; (stretch) QR import
- **Grouping:** assign to groups (e.g., “Lisbon 2025”, “Nomad Cruise”); tags
- **Search & Recall:** search by name, notes, groups, tags
- **Sync & Storage:** cloud sync; offline queue on mobile

### Non-Goals (MVP)
- Team/workspace sharing
- Advanced enrichment & geo-triggers
- Subscriptions/paywall

## 8) Future Feature Considerations
- **Enrichment:** social profile, company, role, avatar
- **Geo-Triggers:** “You’re in Berlin — 12 contacts nearby”
- **Event Mode:** conference QR scanning + auto-grouping
- **Collaboration:** shared groups, exports
- **Monetization:** subscription for enrichment & advanced features

## 9) Platform Notes
- **Web:** focus on review/organization; keyboard-friendly
- **Mobile:** fast capture flow; offline-first; push notifications
- **UX:** consistent design tokens; platform-native gestures/affordances

## 10) Security & Privacy
- OAuth/OIDC; short-lived access tokens, refresh tokens
- Encrypt data in transit (TLS) and at rest
- Least-privilege API keys for providers
- Explicit user consent for enrichment; transparent audit log
- Compliance posture: aim toward GDPR/CCPA best practices

## 11) Risks & Challenges
- LinkedIn API access/limits
- Store approvals (privacy policies, data use)
- Balancing quick capture vs. meaningful enrichment
- Contact deduplication heuristics

## 12) Observability
- API metrics (latency, error rate), background job dashboards
- Structured logging (request IDs, user IDs)
- Crash reporting on mobile (Sentry/Crashlytics)

## 13) Testing Strategy
- Unit tests (domain logic)
- Contract tests (API schemas)
- E2E happy-paths (auth → add contact → group → search)
- Mobile smoke tests for capture flow & offline queue

## 14) Roadmap Hooks
This doc intentionally stays stable. Evolving timelines & milestones live in `/docs/ROADMAP.md`. Major architectural decisions should be captured as ADRs (future `/docs/adr/`).

## 15) Updating This Doc
- Changes via PRs labeled `design-doc-update`
- Keep **Vision**, **Principles**, **Data Model**, and **Risks** current