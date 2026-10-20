# Escape Atlas

A route-survival game: plan a journey, manage time, money and energy, and adapt when a crossing or service is unavailable.

The first playable collection covers the **Brest–Terespol frontier district** with ten authored challenges. One unnamed player experience; no military or historical modes.

## Run locally

Install Node.js 22 or newer. No package installation, accounts or API keys are required.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Click a map location or select a stop, choose transport for each leg, then press **Go**. Each journey animates, settles its cost once, and requires arrival review before the next departure. Local knowledge provides clues, scenario notices and travel papers. Runs and results save on your device.

## What is playable

- Detailed local OpenStreetMap roads, paths, railways, international boundary, crossing locations, waterways and some buildings; street-level zoom, tilt, layer controls and surrounding globe.
- Routes follow connected road/rail geometry rather than straight lines. Walking, cycling, taxi, shuttle and train have different costs and restrictions.
- Ten challenges covering limited cash, fatigue, closures, cancelled trains, papers, opening windows and multiple objectives.
- A pausable planning clock, energy recovery, journey journal, per-challenge saves and recovery after reloading during travel.
- Responsive desktop/mobile interface, reduced motion, local fonts and map assets, and a production offline service worker.

Detailed coverage is one district, not a worldwide street map or satellite imagery. All prices, services, border states and scenarios are fictional game rules. It is not a real-time travel service. Source snapshots and licences are in [public/CREDITS.txt](public/CREDITS.txt).

## Build and verify

```sh
npm test
npm run validate
npm run build
npm run preview
```

The production build is static `dist/`. Serve it over HTTPS or localhost for offline caching. Once the footer says “Offline map pack ready”, the game can reload without a connection. Device storage may be cleared by the browser. Root-path hosting is currently required.

`npm run test:browser` additionally needs an existing Playwright installation and Chromium/Edge. Set `PLAYWRIGHT_NODE_PATH`, `BROWSER_EXECUTABLE` and `GAME_URL` for your machine. `TEST_OFFLINE=1` tests a production build's offline reload. It does not download a browser or install dependencies.

## Architecture

- `src/engine.js`: deterministic state transitions, quotes, resource accounting, save validation.
- `src/network.js`: local OSM graph and transport-aware routing.
- `src/scenarios.js`: ten challenges and game locations.
- `src/map.js`: vendored MapLibre rendering and travel animation.
- `src/app.js`: interface, local saves and planning clock.
- `src/validate.js`: simulated solution witnesses; every challenge must have at least two winning transport strategies.
- `scripts/prepare-region.py`: optional source-data compilation. Normal development uses the committed map pack and needs no Python.

The OSM-derived database is redistributed under ODbL with attribution. MapLibre and fonts retain their respective licences. Original application source has no open-source licence grant yet.

## Budget and mobile

Development and local play use existing hardware and free software. No paid runtime service is needed. Hosting at scale, store developer accounts, signing, device testing and release work may incur costs; those are outside this zero-budget milestone.

The responsive web foundation can later be packaged for Android/iOS. Native projects and store releases are not included yet. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the next milestones.

Code updates are committed and pushed to https://github.com/TheFamousJC/world after validation, as requested.
