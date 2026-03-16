# HappyZone

A private, local-first wellness check-in app built around a calm mobile flow, reusable React components, and in-browser support tools.

## What It Does

- Guides the user through a three-step check-in: mood, support focus, and journal entry
- Generates a compact CBT-style gentle action plan from the current note
- Surfaces a local-only support guardrail when journal text includes higher-risk language
- Includes calming tools outside the main flow: breathing reset, grounding guide, and thought reframer
- Saves recent check-ins on the device and shows a four-week mood heatmap
- Supports light and moonlit dark themes, plus a first-visit disclaimer flow
- Keeps processing in the browser with no backend or remote data storage

## Current Stack

- Vite for local development and hot refresh
- React + TypeScript for reusable UI components and structured state
- Tailwind v4 theme tokens via the Vite plugin
- Static deployment output in `dist/`
- Vitest + Testing Library for unit/component regression coverage
- Playwright for desktop and mobile browser checks

## Development

```bash
npm run dev
```

This starts the Vite dev server with hot module reload.

## Core Commands

```bash
npm run build
```

- `npm run preview`: preview the production build locally
- `npm run typecheck`: run TypeScript without emitting files
- `npm run test`: run Vitest regression tests
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:e2e`: run Playwright browser tests
- `npm run test:e2e:headed`: run Playwright in headed mode
- `npm run test:ci`: run the full local verification gate

## Testing

Current automated coverage includes:

- Unit and component checks for app state, support logic, duplicate-entry prevention, and reframer flows
- Browser checks in desktop Chromium and mobile Chromium emulation
- Persistence checks for saved check-ins, theme choice, disclaimer acknowledgement, and mood insights

The browser tests stay local to the machine running them. The CI workflow in `.github/workflows/ci.yml` runs type checking, Vitest, and Playwright on every push and pull request.

## Privacy

- Check-ins are stored in `localStorage` on the current device/browser
- Theme preference, disclaimer acknowledgement, support analytics, and support preference are also stored locally
- Journal processing, support detection, and mood insights all happen in-browser
- No journal content is transmitted to a server

## Project Structure

- `src/App.tsx`: top-level flow orchestration and persistence wiring
- `src/components/`: reusable UI components for steps, outputs, modals, tools, and history
- `src/lib/happyzone.ts`: local storage, heuristics, plan generation, and helper logic
- `src/content.ts`: mood/focus copy, prompts, support resources, and breathing steps
- `e2e/`: Playwright browser coverage
- `docs/`: prompts, overview notes, and future-work checklist

## Docs

- [Application Overview](./docs/APP_OVERVIEW.md)
- [Future Work Checklist](./docs/TODO.md)
- [Initial Design Prompt](./docs/INITIAL_PROMPT.md)
- [Feature Prompt Notes](./docs/FEATURE_PROMPTS.md)

## Deployment

Deploy the contents of `dist/` to any static host. No runtime server is required after build.
