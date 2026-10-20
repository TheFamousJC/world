# Development plan

## Current scope

Build a polished route-survival game around one detailed Brest–Terespol district and ten authored scenarios, without paid runtime APIs. Keep one unnamed player experience. Military and historical modes are out of scope.

## Milestone 1 — playable foundation (implemented)

- Local detailed OSM map pack: roads, paths, rail, international border, crossings, water and some buildings. Zoom, tilt, globe context and layer controls.
- Transport-aware route graph, five available transport modes, waypoint planning and per-leg choices.
- Ten scenarios; time, cash, energy, documents, closures, service cancellations, opening windows and objective stops.
- Local knowledge, resting, journal, challenge selection, per-run saves and results.
- Animated travel. Invalid departures spend nothing. Pending travel is locked, survives reload and settles once. Arrival review prevents repeated Go charges.
- Desktop/mobile layouts, reduced motion and production offline caching.
- Automated rule tests, two simulated winning strategies per scenario, browser journey and mobile checks, static build and CI.

## Milestone 2 — playtesting and deeper simulation

- Observe first-time players: map readability, objective comprehension, clues, route building and feedback.
- Add crossing-specific permissions and approach networks. Current rules detect an international boundary crossing and apply scenario-wide restrictions; they do not model every checkpoint independently.
- Introduce authored mid-journey events and alternative outcomes. Current closure and cancellation conditions are fixed per scenario, with time-dependent opening windows.
- Balance cash/time/energy from real play sessions. Expand losing outcomes beyond validation guards; avoid pretending every challenge already has five authored narrative failures.
- Add ferries, horses and other transport only with valid local routes, access rules and scenarios that justify them.
- Improve map coverage and performance on low-end phones. Current buildings are partial, heights approximate, and no satellite imagery or terrain is bundled.

## Milestone 3 — scalable content

- Scenario schema and editor; scenario seeds and reproducible event timelines.
- Region packs with explicit source dates, licence records and size limits.
- Automated route graph connectivity, crossing, solvability and resource-budget checks.
- Generate candidate scenarios, then curate and playtest them. Hundreds of meaningful scenarios need validation, not thousands of manually drawn line segments.
- Shared challenge codes and a consent-based save export/import before online accounts.

## Milestone 4 — Android and iOS

- First test the web game on real Android and iOS hardware, including offline storage, WebGL, touch, accessibility and battery use.
- Package the web core with an appropriate native wrapper after evaluating platform requirements.
- Add native icons/splash screens, safe-area handling, offline region storage, signed builds and platform lifecycle tests.
- Complete privacy, content ratings, store assets and release checks. Store accounts and signing/distribution costs require a later budget decision.

## Real-world events

No live feeds are connected in the current game. A future event pipeline must distinguish dated source evidence from game fiction, use reviewed snapshots, support replay and remain playable without a live connection. Never present fictional access or game routes as real-world safety advice.

## Zero-budget boundary

No paid services, external runtime map requests, account system or AI inference calls. Local development and play are supported with free tools and existing hardware. Free hosting limits and future native release costs must be assessed when deployment is requested.

## Delivery policy

Run appropriate tests, build, commit and push each completed update to `TheFamousJC/world`. Keep raw source downloads, old prototypes, secrets and build output out of Git. Never force-push user work.
