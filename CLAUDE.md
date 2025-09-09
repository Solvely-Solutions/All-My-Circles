# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Circles** is a contact management application for digital nomads, travelers, and networkers. This is a monorepo containing web app, mobile app, backend API, and CRM integrations.

## Architecture

This monorepo contains:
- **Web App** (`apps/web/`): Next.js responsive dashboard
- **Mobile App** (`apps/mobile/`): React Native for iOS/Android with offline-first capabilities
- **Backend API** (`api/`): Node.js + Express API with PostgreSQL database
- **Shared Packages** (`packages/`): Common utilities and TypeScript types
- **CRM Integrations** (`integrations/`): HubSpot and other CRM connectors
- **Auth**: OAuth 2.0 / OIDC (Google, LinkedIn, Apple) + email
- **Hosting**: Web (Vercel), API (Railway/AWS/GCP), DB (Supabase/RDS)

## Monorepo Structure

```
/Circles
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile app
├── api/              # Node.js backend API
├── packages/
│   ├── shared/       # Shared utilities and business logic
│   └── types/        # TypeScript type definitions
├── integrations/
│   └── hubspot/      # HubSpot CRM integration
├── docs/             # Project documentation
└── CLAUDE.md         # This file
```

## Core Entities

- **User**: Authentication and settings
- **Contact**: Name, company, role, identifiers (email/phone), notes, groups, tags
- **Group**: Event/location/custom clustering (e.g., "DevCon 2025", "Austin Trip")
- **Tag**: Flexible categorization system
- **EnrichmentJob**: Background processing for contact data enhancement

## Key Files

- `docs/DESIGN_DOC.md`: Comprehensive technical design document with data model, tech stack, and feature specifications
- `docs/ROADMAP.md`: Development phases from MVP to premium features
- `docs/ARCHITECTURE_OVERVIEW.mmd`: Mermaid diagram for system architecture
- `docs/UI_MOCK`: React Native component mock-up with cross-platform glass UI design system using NativeWind styling and Moti animations

## Development Phases

1. **Phase 0**: Project scaffolding, CI/CD, environment setup
2. **Phase 1**: MVP contact basics with auth, CRUD, search, offline queue
3. **Phase 2**: Enhanced capture (QR/VCARD import, phone contacts)
4. **Phase 3**: Smart enrichment with provider integrations
5. **Phase 4**: Growth features and premium subscription model

## Design Principles

- **Seamless Capture**: Quick contact addition with minimal friction
- **Contextual Recall**: Smart filtering and grouping for relevant contacts
- **Cross-Platform Sync**: Consistent data across web and mobile
- **Privacy First**: User-controlled data enrichment with explicit consent
- **Offline-First**: Mobile apps work without connectivity

## UI Design System

The UI mock demonstrates a cross-platform "glass morphism" design with:
- **React Native**: Single codebase for iOS/Android and web (via React Native Web)
- **NativeWind**: Tailwind-like styling for React Native components
- **Moti**: Smooth animations powered by React Native Reanimated
- **Glass Cards**: Translucent backgrounds with backdrop blur effects
- **Dark Theme**: Deep blue gradient background with white translucent UI elements

## Data Flow

The system follows a client-server architecture where web/mobile clients interact with a REST API that handles business logic, authentication, and background enrichment jobs. PostgreSQL stores all persistent data with jsonb fields for flexible metadata.

Note: This project is currently in the design phase. Most implementation details are defined in the design documents rather than actual code.