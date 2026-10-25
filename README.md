# Escape Atlas by 3Sci Labs

**[▶ Play the live game](https://thefamousjc.github.io/world/)**

A route-survival game: plan a journey, manage time, money and energy, and adapt when a crossing or service is unavailable.

The collection contains **50 civilian stories, 250 operation routes and 500 compulsory missions**. Each story has five increasingly demanding operations over one shared 24-hour clock. Each route has two ordered required missions, one optional cash contact and one optional recovery contact. The ten original practice challenges and original eight-section Nightfall saves remain available. No military or historical modes.

Ten stories use the detailed offline Brest–Biała Podlaska road/rail pack. Forty world expeditions use eight two-city corridors across Asia, Africa, North and South America, and Oceania. All forty world stories now use detailed offline OpenStreetMap city-to-airport packs, including actual landside airport locations; flights only connect designated terminals. Each world story includes one airport transfer. The 250 route-scenarios share these nine geographic regions.

First-time players see a five-slide introductory wizard. **Stories** opens the searchable illustrated library and five-operation briefing. The clock starts on launch. **Help** opens the gameplay page, with a linked FAQ; both are cached offline. Each story can be resumed separately on this device. Missions → Help & settings → How to play replays the introduction.

Later operations raise journey duration, effort, mission collection time and control delays; some later stages cancel cycling. The world uses game credits shown as £, not real local prices. All services and restrictions remain fiction.

Validation: `npm test` covers the complete catalogue, resource accounting, ordered missions, one-time bonuses, failure guards, flight terminals and saved journeys. `npm run validate` simulates two complete winning strategies per story through all five operations, in addition to the original ten practice scenarios. `npm run test:stories-browser` walks all 50 illustrated briefings and a complete world escape through the UI, including flight, optional supplies, pause, reload, help and FAQ.


## Nightfall reference experience (0.15.0)

A next-step control follows each run through planning, route review, collection, paused recovery and operation handoffs; it never chooses transport or departs automatically. Completed pickups lead explicitly to the destination, and a five-step progress rail shows the current operation. Portrait tablets through 1024 px use the full-width map and sticky controls; larger landscape screens retain the desktop panels. Map framing updates when orientation changes. The guidance also handles world airport connections and pilot document gates.

`npm run test:nightfall-browser` completes all five Nightfall operations using those actions, optional cash, ten items, a paused reload, offline completion in production and resource carry-over at iPad portrait/landscape and phone sizes. Physical-device touch/performance validation remains a separate release check.

## Mission pickup flow (0.14.0)

Mission map badges show 1 and 2 separately from station, airport and contact symbols, and become ticks after collection. The map key explains required missions, optional supplies and each place symbol. Arrivals open a pickup card with an explicit Collect action and ordered-mission feedback. A mission already in the plan offers Go here without deleting its route; map click-again removal remains available. Blocked mission/item routes offer a collection or replanning action, and document/papers failures link to their relevant desk.

## Reliable update link (0.13.2)

Update game is a real link to the recovery page, independent of a waiting service worker or its activation event. Tapping it saves and pauses progress, shows feedback and refreshes the app while retaining downloaded region maps. Offline taps explain how to reconnect and retry.

## Start and update behaviour (0.13.1)

Opening or reloading the game always restores it paused, including an unfinished journey. Press Resume game to continue; committed travel settles once. Time and supplies are at the top of the desktop mission panel and the sticky mobile deck. A version label identifies the loaded release. New offline builds wait for Update game instead of automatically reloading active play. Settings → Refresh to latest version repairs older caches while preserving saves and regional map caches.

## Browser gameplay polish (0.13.0)

Go honours the selected next leg, route prefix or entire plan. Its estimate shows the same selected section. Mobile keeps the estimate, failure feedback and next objective beside the departure controls; paused games disable Go. Settings provides phone-accessible Help, FAQ and Practice.

## Home screen release plan

See [the development plan](DEVELOPMENT_PLAN.md) for prioritised installation, offline reliability, progress protection, mobile usability and release checks. Native app packaging follows this milestone.

## Detailed worldwide maps (0.11.0)

Every mission corridor uses self-hosted OpenStreetMap vector packs: 16 cities, each including its real airport. Ground travel follows connected road edges, respects mode access and one-way direction, and uses exact public-road anchor nodes for named contacts. Arbitrary points have an 80 m maximum road-access link. There is no schematic fallback for a declared detailed region. The game does not model every turn restriction, signal or live traffic condition.

The globe and Brest remain the core download. Choosing any world story downloads its two regional packs, builds the road graphs and caches the files for later offline use. A content-versioned regional cache survives application-only updates; map changes receive a new cache revision. Loading holds the planning clock. Rendering switches between the two packs by the player's current city. This registry/loader is reusable for future world regions. Maps are bounded mission/airport corridors, not complete metropolitan extracts.

Older worldwide saves preserve cash, elapsed time, energy, items and completed missions. Old pending/untravelled schematic plans are cleared without charging fares, and the run pauses to let the player replan using the new locations. Current real-road pending journeys still resume normally.

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

Open http://127.0.0.1:4173. Enter the district from the globe, click a destination and choose one of the available transport cards. The leg appears immediately under **Plot your escape**. Repeat for more stops, then press **Go** to travel the plan. Click an existing planned stop again to remove it and every leg after it. Planning consumes real seconds; travel simulates the quoted journey time. Ask HQ, saving and reduced motion remain available.

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

Detailed coverage consists of bounded mission districts and airport corridors across 16 cities plus Brest, rather than every street on Earth. All prices, services, border states and scenarios are fictional game rules. It is not a real-time travel service. Source snapshots and licences are in [public/CREDITS.txt](public/CREDITS.txt).

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

Worldwide preparation: `python scripts/prepare-world.py --download` fetches bounded public OSM vector extracts sequentially; subsequent runs use ignored cached raw responses. `node scripts/place-world-contacts.js` anchors the fictional contacts to connected walking and driving road nodes. The configuration is `scripts/world-regions.json`. Airport coordinates are reference targets; the distributed contact file records the actual selected OSM road node.

Operation 3 starts with an airport desk handoff, followed by the destination-city pickup. It never requires a return to the departure city. Arrival and saved-run camera framing focus on the current location, and Mission area filters to the current city rather than spanning both flight endpoints.

## Field-desk pilot (0.12.0)

The Shelter Keys (`escape-12`) is the only story with the new mechanics. `src/pilot.js` contains authored reports, per-operation timetables, document checks and validation. `src/pilot-ui.js` renders the field desk. Every operation has an unverified report and two document fields. Verify/refresh dispatch (£2, 5m), wait (15m, £0), or compare evidence from collected mission items. Correct document submissions cost 3m; mismatches cost 4m and do not grant clearance. Clearances gate operation goals and the operation-3 flight. Airport evidence is collected on site.

Schedules anchor to each operation’s actual start on the shared clock; old reports, clearances and start times persist between operations and reloads. Failed transport checks take no fare. Unknown motor delays are shown as unverified estimates and disclosed at departure. Scheduled waiting is included in quotes, animation and final accounting. Pre-pilot saves keep resources and items, clear untravelled plans and pause for review.

`node scripts/pilot-browser-check.cjs` exercises the entire pilot through the UI, including a document mismatch, flight, waiting, offline restoration, all five clearances, and the ending. `tests/pilot.test.js` covers accounting, deadlines, report age, exact boarding cutoffs, independent stage permissions, stale quotes and invalid saves. Route colours/patterns and per-leg arrival estimates apply across the game. Map labels use local system fonts and require no remote glyph service.

## Courier difficulty pilot (0.22)

Open **Stories → New courier pilot** for The sealed handoff: one standalone offline operation with a collect → deposit → receipt chain, fixed-stop timetabled shuttles and a limited budget. Existing stories and practice rules are unchanged. The counter window and complete transport quotes are shown before commitment. See [DIFFICULTY_AUDIT.md](DIFFICULTY_AUDIT.md) for the measured ten-story baseline and two verified mixed-mode wins. Reproduce with `npm run audit:difficulty`; use `npm run test:courier-browser` against a local server for the UI/offline playthrough.

## Save backup and recovery

Open Missions → Help & settings → Settings → Save backup & recovery. Download a JSON backup of the current run, or choose a backup to preview and confirm restoration. The game pauses; imported and restarted games wait for Resume, including unfinished travel. A single local recovery copy can undo the latest restart or restore. It is replaced by the next such action. Backups contain progress, not maps, audio preferences or completion records. Download a world region once before restoring it offline. No files are uploaded.

Run `node --test tests/backups.test.js` and `npm run test:backups-browser` (local server at port 4187, or set GAME_URL). The release-build browser check also repeats restoration offline.

## Watched handoff pursuit pilot (0.24.0)

Stories → New pursuit pilot → The watched handoff. This separate operation has 150 minutes, £24 and two explicit courier objectives; the deposit finishes by T+95. Contact actions and named shuttle tickets create reports. A pursuer follows offline OSM corridors, completing each finite search before responding to the next trace. HQ shows source/time, expected search windows and approximate amber areas, with warning grace before interception. Walking and taxis do not create ticket traces; the pursuer does not track the unseen moving traveller. Known unsafe shuttle waits are rejected before a fare is charged.

◈ marks the workshop back room (documents required), riverside safe house (receipt required) and free station alcove. Each can be used once. Hiding quotes the full time needed to wait out known local searches, plus its fee and energy recovery; it advances the shared deadline. Pause freezes the world clock. Hiding never prevents a future trace. Rules and HQ acknowledgements survive saves and JSON backups.

Tests: `node --test tests/pursuit.test.js`, `npm run test:pursuit-browser`. Rebuild the authored OSM corridors after changing the Brest graph with `node scripts/build-pursuit-roads.js`; tests compare every corridor to the current road graph. Existing courier and 50 stories keep their original balance. Broader roadblocks, radio silence and five-operation pursuit remain planned.

## The watched route — full five-operation story (0.25.0)

Open Stories → The watched route · Full five-operation story. One 24-hour clock, £180 and 85% starting energy cover Osaka and Tokyo, using the detailed offline OSM packs and real Itami/Haneda terminal locations. All services, contacts, documents, searches and events remain game fiction. Existing 50 stories and standalone pilots are retained.

1. A watched envelope: collect and deposit the briefing, then reach shelter.
2. The compromised contact: recover the original passport, submit the manifest, then reach Itami. No required city return follows airport arrival.
3. The departure window: check the manifest at the airport, solve both document fields through Ask HQ, fly to Haneda and receive the arrival bag. Flight departures use the shared clock: T+420, +540, +660, +780 (7, 9, 11 and 13 hours after story start).
4. Orders have changed: collect the relay packet, read HQ’s redirect and deliver to the new authorised desk. Completed evidence and existing plotted stops are preserved; edit your own route.
5. The final extraction: obtain a token, deposit the ledger and approach Osaki extraction on foot.

Each operation offers optional £35 contingency cash and energy recovery. Pursuit traces, shelter use, documents, time, money and energy carry forward. Checkpoints add published motor-route delays while active; walking is unaffected. Later operations shorten the response delay for new pursuit traces without changing old search schedules. Outcome text reflects remaining reserves and shelter use.

Validation: `npm run validate:thriller`, `node --test tests/thriller.test.js`, `npm run test:thriller-browser` (port 4187, or GAME_URL). Tested strategies use 748 minutes/£38 left/67% energy remaining (taxi-heavy with extra cash/energy) and 1019 minutes/£104 left/41% energy (walking, shuttle and flight). Planning time is additional. Each operation has six tested failure/recovery guards. The release browser check continues offline and reloads a pending flight, preserving the quote and settling once.

Japan pursuit corridors can be rebuilt with `node scripts/build-pursuit-japan.js`; ground paths derive from the attributed bundled OSM packs, and the pursuer’s airport transfers include an authored 90-minute preparation allowance. The route-generation and validation scripts are development tools, not remote runtime services.

## HQ inbox and worldwide pursuit (0.26.0)

The header now includes a permanent HQ inbox with an unread count. Reading it marks received messages as read without spending game time; reports remain available after their search windows end. The map shows an amber enemy marker and area labelled with the last confirmed location and its age in game minutes. Reports become stale after 15 minutes or when that search ends. This is historical intelligence, not live GPS: the enemy keeps moving while the marker stays at its last confirmed sighting. The red marker remains the player. Click the enemy marker to open HQ, or the legend report to frame its last reported area.

Every one of the 50 catalogue stories, the legacy campaign and The watched route now has pursuit across operations. The 10 practice challenges and standalone courier lab remain training options. Watched contacts, shuttle tickets and flights leave traces. New catalogue traces store paths computed from the loaded offline OSM graph; international transfers follow existing airport corridors with a preparation allowance. New responses get faster with each operation; previous reports, pursuit paths, acknowledgements and shelter use carry forward. Catalogue contacts and bonus stops offer one-use shelters; their full time and energy effects are quoted. HQ also offers a free 15-minute wait without concealment. Longer shelter stays can wait out a known search, at the cost of the shared deadline. The legacy campaign now shares a 24-hour deadline.

Existing catalogue saves pause when pursuit is introduced, preserving resources, objectives and pending travel. No old contact or ticket traces are created retroactively. Save backups validate and retain pursuit geometry, report history and read status. No new map data, services, API keys or runtime AI are required.

Validation: all 489 deterministic tests pass, including two adaptive winning strategies for each catalogue story and legacy campaign alternatives. Run npm run test:hq-inbox-browser for isolated desktop, 360/390-pixel mobile, confirmed/stale sightings, unread persistence, safe-save migration and a South African contact playthrough. Against a release build it also checks offline reloads and saved routes.
