# HappyZone

A private, browser-based check-in app built around a calm mobile-first flow, Tailwind v4 tokens, and local-first support prompts.

## Current Stack

- Vite for local development and hot refresh
- React + TypeScript for reusable UI components and structured state
- Tailwind v4 theme tokens via the Vite plugin
- Static deployment output in `dist/`

## Development

```bash
npm run dev
```

This starts the Vite dev server with hot module reload.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```

## Type Checking

```bash
npm run typecheck
```

## Testing

Unit and component regression tests:

```bash
npm test
```

Watch mode while building features:

```bash
npm run test:watch
```

Browser checks with Playwright:

```bash
npm run test:e2e
```

This suite runs the main flows in desktop Chromium and mobile Chromium emulation, including reload checks for locally persisted theme and saved check-ins.

Run the full local gate:

```bash
npm run test:ci
```

The browser tests stay local to the machine running them. The CI workflow in `.github/workflows/ci.yml` runs type checking, Vitest, and Playwright on every push and pull request.

## Deployment

Deploy the contents of `dist/` to any static host. No runtime server is required after build.
