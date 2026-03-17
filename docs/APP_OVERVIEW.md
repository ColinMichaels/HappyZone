# HappyZone Overview

## Product Snapshot

HappyZone is a private, mobile-first check-in app focused on reducing friction when a user needs a quick emotional reset or a short journaling flow. The current application is local-first and static-host friendly: there is no backend, and the app works as a browser-based React + TypeScript SPA.

## Current User Flows

### 1. Guided Check-In

The main flow is a three-step wizard:

1. Select a mood
2. Select a support focus
3. Write a journal entry

Submitting the journal creates a short CBT-style gentle action plan and resets the draft back to Step 1 to avoid accidental duplicate saves.

### 2. Safety Guardrail

If the journal includes higher-risk language, the app shows a local-only `Get support` action near the submit controls. That opens an accessible modal with local crisis resources and a local safety-plan template.

### 3. Thought Reframer

The thought reframer is available from the journal step and from the calming tools area. It walks the user through:

1. Evidence for the thought
2. Evidence against it
3. A balanced version of the truth

The final balanced sentence can be inserted back into the journal.

### 4. Calming Tools

The current calming tools panel includes:

- A paced breathing reset
- A 5-4-3-2-1 grounding guide
- A reframer launcher

These tools are designed as optional helpers outside the main journaling flow.

### 5. History And Insights

The app stores recent check-ins locally, shows a compact history list, and derives a four-week mood heatmap using only data saved in the browser.

### 6. Returning Summary And Reminders

When the user comes back, the app compares the current session against the previous local visit snapshot and builds a compact progress summary. That summary can show:

- due reminders
- recent streak length
- recent dominant mood
- fresh check-ins since the last visit

Reminders are attached to specific journal entries so the user can jump back into the linked plan instead of seeing an orphaned notification.

### 7. Calendar And Export

The app now includes a responsive month view that places:

- journal entries on the day they were created
- reminders on the day they are scheduled

The calendar is local-first. External calendar support is currently a manual `.ics` export, which creates a one-way snapshot suitable for import into services like Google Calendar, Apple Calendar, or Outlook.

## Architecture

### UI

- `src/App.tsx` coordinates top-level state, persistence, and modal visibility
- `src/components/` contains reusable view components
- `styles.css` contains the Halo theme styles and component-level layout rules

### Logic

- `src/lib/happyzone.ts` contains persistence helpers, support detection, plan generation, duplicate prevention, reminder/calendar export logic, and analytics helpers
- `src/content.ts` contains prompts, mood/focus copy, support resources, and breathing-step content

### Storage

The app uses `localStorage` for:

- check-ins
- reminders
- visit snapshot / last-seen timestamp
- theme preference
- disclaimer acknowledgement
- support analytics counters
- encrypted support preference

## Verification Snapshot

As of the current repo state, the main local verification path is:

```bash
npm run test:ci
```

That runs:

- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`

The Playwright suite currently covers desktop Chromium and mobile Chromium emulation.

## Deployment

The repo now includes a dedicated GitHub Pages deployment workflow:

- pushes to `master` trigger `.github/workflows/deploy-pages.yml`
- the Pages build uses the repository base path (`/HappyZone/`)
- the app remains deployable as a static site

There is also a `gh-pages` package install and a manual `npm run deploy` script available as a local fallback.

## Current Limits

- No backend or cloud sync
- No real browser or OS-level reminder scheduling yet; reminders are surfaced when the app is opened again
- Calendar export is one-way and does not stay synced after import
- No clinician review or medical-service functionality
- Support resources are currently U.S.-centric
- Accessibility has automated coverage and structured markup, but still needs periodic manual device and screen-reader QA
