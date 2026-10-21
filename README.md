# Escape Atlas by 3Sci Labs

**[▶ Play the live game](https://thefamousjc.github.io/world/)**

A route-survival game: plan a journey, manage time, money and energy, and adapt when a crossing or service is unavailable.

The collection contains **50 civilian stories, 250 operation routes and 500 compulsory missions**. Each story has five increasingly demanding operations over one shared 24-hour clock. Each route has two ordered required missions, one optional cash contact and one optional recovery contact. The ten original practice challenges and original eight-section Nightfall saves remain available. No military or historical modes.

Ten stories use the detailed offline Brest–Biała Podlaska road/rail pack. Forty world expeditions use eight two-city corridors across Asia, Africa, North and South America, and Oceania. Five Japan stories now use detailed offline OpenStreetMap road packs, including actual Itami and Haneda landside airport locations. The other 35 world stories use **explicitly labelled fictional schematic ground links**; flights only connect designated terminals. Each world story includes one airport transfer. The 250 route-scenarios share these nine geographic regions.

First-time players see a six-step introductory wizard. **Stories** opens the searchable illustrated library and five-operation briefing. The clock starts on launch. **Help** opens the gameplay page, with a linked FAQ; both are cached offline. Each story can be resumed separately on this device. `?` replays the introduction.

Later operations raise journey duration, effort, mission collection time and control delays; some later stages cancel cycling. The world uses game credits shown as £, not real local prices. All services and restrictions remain fiction.

Validation: `npm test` covers the complete catalogue, resource accounting, ordered missions, one-time bonuses, failure guards, flight terminals and saved journeys. `npm run validate` simulates two complete winning strategies per story through all five operations, in addition to the original ten practice scenarios. `npm run test:stories-browser` walks all 50 illustrated briefings and a complete world escape through the UI, including flight, optional supplies, pause, reload, help and FAQ.


## Detailed Osaka–Tokyo maps (0.10.0)

Japan now uses two self-hosted OpenStreetMap vector packs: Osaka centre–Itami Airport and Tokyo Shinagawa–Haneda Airport. Ground travel follows connected road edges, respects mode access and one-way direction, and uses exact public-road anchor nodes for named contacts. Arbitrary points have an 80 m maximum road-access link. There is no schematic fallback for a declared detailed region. The game does not model every turn restriction, signal or live traffic condition.

The globe and Brest remain the core download. Choosing a Japan story downloads its regional packs (about 45 MB Osaka + 24 MB Tokyo uncompressed), builds the road graphs and caches the files for later offline use. A content-versioned regional cache survives application-only updates; map changes receive a new cache revision. Loading holds the planning clock. Rendering switches between the two packs by the player's current city. This registry/loader is reusable for future world regions. Maps are bounded mission/airport corridors, not complete metropolitan extracts.

Old Japan saves preserve cash, elapsed time, energy, items and completed missions. Old pending/untravelled schematic plans are cleared without charging fares, and the run pauses to let the player replan using the new locations. Current real-road pending journeys still resume normally.

Prepare from cached raw OSM vectors with `python scripts/prepare-japan.py`; add `--download` only to fetch missing raw extracts. Run `node scripts/place-japan-contacts.js` to choose public-road anchors in strongly connected walking/driving components. Raw responses stay in ignored `assets/`. All distributed map data retains ODbL attribution and provenance. No tile scraping, paid services, keys or runtime map APIs.

`tests/japan-routing.test.js` verifies map provenance, airport positions, directed road-edge geometry, bidirectional contact access, arbitrary points, water, mode restrictions and save migration. The whole catalogue validator runs both full-story witnesses on the new Japan graphs. Browser checks also cover a complete Itami–Haneda escape and offline regional reload. `npm run test:japan-cache-browser` checks a first-visit download, application-only worker activation, dataset-cache retention and offline save restoration.

## Original Nightfall (legacy saves)

An eight-section operation from Brest through Terespol, Koroszczyn, Kobylany and Małaszewicze to Zalesie, then back through Brest and Koroszczyn before the final evacuation in Biała Podlaska. Begin with £300 and 22 hours. Complete the marked detour tasks per section; the final section requires both package and supply pickups. The passport in section 7 is required at the border. reach its location and press Complete. Cash, energy and elapsed time persist through checkpoints and reloads. The operation clock keeps running between sections; Pause stops planning time and blocks travel/actions until resumed. Go simulates actual journey time.

Satellite mode optionally streams NASA GIBS archival Landsat imagery from 2000. It requires internet; vector maps and all routing remain offline. Borders, missions and transport availability are game rules, not current travel advice.

## Run locally

Install Node.js 22 or newer. No package installation, accounts or API keys are required.

```sh
npm run dev
```

Open http://127.0.0.1:4173. Enter the district from the globe, click a destination and choose one of the available transport cards. The leg appears immediately under **Plot your escape**. Repeat for more stops, then press **Go** to travel the plan. Click an existing planned stop again to remove it and every leg after it. Planning consumes real seconds; travel simulates the quoted journey time. Local knowledge, saving and reduced motion remain available.

## Deadline clarity (0.6.1)

Equal-size mission clocks are labelled **Time to reach safety** and **Border closes in**. The border clock appears only in scenarios with a scheduled closure. Closing window now uses a plain-language extraction briefing that explains both deadlines. The styling has a spy-thriller tone without changing the civilian game rules.

## Simplified planning (0.6)

Click a map destination. A transport chooser shows available modes with time and fare; selecting a mode immediately adds the leg under **Plot your escape**. Click another destination to continue, or press the single **Go** button to travel the entire current plan. Clicking an existing planned stop (or its remove button) truncates the route at that stop, preserving earlier legs. The player stays in their actual location.

The countdown now includes seconds: one real planning second consumes one game second. While travelling, the countdown animates the quoted simulated journey time; settlement still charges that duration only once. Default animations take 18–28 seconds per leg; reduced motion remains available. Hidden tabs pause planning time.

## Clarity update (0.5.1)

Stop names are always visible at district zoom, with current-position, goal and planned-stop labels. Timed-crossing scenarios show a visible countdown. A blocked crossing leg explains the time remaining, its duration, why it is late, and whether a faster route or a restart is needed. The scenario rule requires the whole crossing leg to finish before closing. An unsuccessful departure changes neither position nor fare; earlier completed travel remains spent.

## Indirect journeys (0.5)

Every challenge requires a completed intermediate stop at least 250 metres from both the start and goal. Direct start-to-goal departures are unavailable. The stop may be a custom map point; a token waypoint beside the start does not count. Costs remain derived from actual mapped legs, boarding waits, walking access and crossing delays. Choose **New walking + taxi walkthrough** to start a guided Brest–Terespol run while choosing the intermediate point yourself.

## Map-first planning update (0.4)

Planning time starts on your first map selection. Free map clicks retain their coordinates, with approximate local road access; mapped water and unconnected points show no route. Points within roughly 50 metres of a named game location select that location so its objective remains usable. Coverage is still one district.

A draft quote appears before a leg is committed. Mixed transport is supported at arbitrary road points; trains and shuttles still require their appropriate station/stop types. Full-route and prefix travel settle one leg at a time, re-check resources and restrictions, and recover after reload without double charging. **Stop after this leg** ends automatic travel at the next stop. Every run starts at its scenario location; selecting future map points never teleports the player.

## Dashboard update (0.3)

The globe fills the desktop viewport behind floating mission and route panels. Focus map hides those panels; on phones the map appears first, with planning below. Travel uses a departure overview, moving follow camera and arrival overview; switch Camera to overview for a fixed route view or enable reduced motion.

Transport choices reflect each leg’s mapped connections, station requirements, cancellations and hard border closures. Walking remains selectable when a foot connection exists; resources and opening windows are still checked on departure. Motor journeys include short walking access to and from their boarding network. Those connectors are approximate map anchors, not verified entrances. Add intermediate stops to walk out of a station and switch transport.

Dashboard and camera ideas were studied from the supplied gods-eye-view ZIP; the styling and MapLibre camera implementation are original. No restricted imagery, datasets, Cesium application or external services were imported.

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

The production build is static `dist/`. Serve it over HTTPS or localhost for offline caching. Once the footer says “Offline map pack ready”, the game can reload without a connection. Device storage may be cleared by the browser. The same build supports root hosting and project paths such as `/world/`. All game assets and offline caches stay inside the site path.

`npm run test:browser` additionally needs an existing Playwright installation and Chromium/Edge. Set `PLAYWRIGHT_NODE_PATH`, `BROWSER_EXECUTABLE` and `GAME_URL` for your machine. `TEST_OFFLINE=1` tests a production build's offline reload. It does not download a browser or install dependencies.

## Architecture

- `src/planning.js`: map-selection drafts, route sections and idempotent queue settlement.
- `src/engine.js`: deterministic state transitions, quotes, resource accounting, save validation.
- `src/network.js`: local OSM graph and transport-aware routing.
- `src/scenarios.js`: ten challenges and game locations.
- `src/map.js`: vendored MapLibre rendering and travel animation.
- `src/app.js`: interface, local saves and planning clock.
- `src/validate.js`: simulated solution witnesses; every challenge must have at least two winning transport strategies.
- `scripts/prepare-region.py`: optional source-data compilation. Normal development uses the committed map pack and needs no Python.

The OSM-derived database is redistributed under ODbL with attribution. MapLibre and fonts retain their respective licences. Original application source has no open-source licence grant yet.

## GitHub Pages deployment

`.github/workflows/pages.yml` tests, builds and deploys `dist/` after every push to `main`. It also supports manual runs from the Actions tab. Configure the repository under **Settings → Pages → Source → GitHub Actions**. The workflow uses GitHub's Pages artifact and deployment actions; no hosting secret or paid service is required.

Live game: https://thefamousjc.github.io/world/

To test a production build under the same project path in PowerShell:

```powershell
npm run build
$env:BASE_PATH='/world/'
$env:PORT='4178'
npm run preview
```

Open http://127.0.0.1:4178/world/. Remove the temporary `BASE_PATH` environment variable when returning to root-path development. The normal development server still defaults to `/`. Browser saves are per device and origin; localhost progress does not transfer automatically to the public site.

## Budget and mobile

Development and local play use existing hardware and free software. No paid runtime service is needed. Hosting at scale, store developer accounts, signing, device testing and release work may incur costs; those are outside this zero-budget milestone.

The responsive web foundation can later be packaged for Android/iOS. Native projects and store releases are not included yet. See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for the next milestones.

Code updates are committed and pushed to https://github.com/TheFamousJC/world after validation, as requested.

Border delays: 20 minutes in standalone scenarios, 30 in the early operation, 45 in section 6 and 60 in section 7. Quotes include these waits. Walking drains energy during travel. At 20% energy a mandatory, free 25-minute rest restores 40 points before continuing; all rests are included in quoted time, animations and saved journey accounting.
