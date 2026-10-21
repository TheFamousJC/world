# Escape Atlas home screen development plan

Updated 21 October 2026 against version 0.12.2.

## Current priority Browser gameplay

Prioritise the online browser experience before installation work: dependable route decisions, readable map and journey graphics, clear mission feedback and a consistent desktop/mobile interface. Version 0.13.0 addresses selected travel sections, matching estimates and visible mobile feedback. Continue with full-story playtesting and observed UX problems before adding content. The home-screen phases below remain the subsequent release checklist.

## Release goal

Make Escape Atlas dependable and enjoyable as a game launched from an Android or iPhone home screen. A player should be able to install it, understand the rules, download a story, finish all five operations offline and return later without losing progress.

Keep the existing civilian game, free hosting and offline map routing. Finish this milestone before native packaging or more stories. The phases below are planned work, not completed features.

## Current foundation

- 50 stories with five operations and two ordered missions per operation, plus optional cash and energy contacts. The original ten practice challenges and legacy Nightfall campaign remain available.
- Detailed offline OpenStreetMap coverage for the Brest corridor and 16 worldwide mission cities with actual airport locations. Flights connect designated terminals.
- Custom map stops, transport quotes, route editing, animated travel, border checks, energy recovery, shared resources and local saves.
- A 12-page introduction, Help and FAQ, reduced motion, optional online NASA satellite imagery and a mobile panel that keeps Go, resources and missions visible.
- The Shelter Keys pilots uncertain intelligence, transport timetables and document checks. Those systems are not enabled across the whole catalogue.
- Automated rules, story validation and browser checks exist. Desktop Edge checks at phone widths do not replace testing installed Safari and Chrome on physical phones.

The installation manifest currently has one SVG icon, with no dedicated Apple touch icon or installation guide. Map caching exists, but there is no player-facing pack manager or save export/import. App updates currently activate immediately and reload the page; replacing that with a safe update flow is a release priority.

## Priority and delivery order

| Phase | Priority | Deliverable | Completion check |
| --- | --- | --- | --- |
| 1 | Essential | Home-screen installation and a useful launch screen | Install, launch, resume and find Help on Android and iPhone |
| 2 | Essential | Reliable offline downloads and safe updates | Download both story maps, restart offline and finish the story; update without losing a journey |
| 3 | Essential | Protected progress and consistent phone lifecycle | Lock, switch apps, close and reload without duplicate charges or lost items |
| 4 | Essential | Clear touch controls and map readability | New players can plan, edit and travel without coaching or unnecessary scrolling |
| 5 | Essential | Fair and varied five-operation stories | Every story remains solvable and pressure increases without hidden arbitrary failures |
| 6 | Release requirement | Performance, accessibility and device testing | Pass the release checklist on the agreed physical devices |
| 7 | After release | Evidence-led improvements | Fix observed problems before choosing native app development |

## Phase 1 Home screen installation and launch

- Add properly sized PNG app icons, a separate maskable icon and Apple touch icon derived from the existing brand artwork. Check safe areas, name, manifest scope and launch URL under `/world/`.
- Add an Install option with Android and iPhone instructions, shown only when useful. If an automatic install prompt is unavailable, explain the manual steps. Dismissal must not interrupt play.
- Replace the initial map-loading wait with a clear branded launch state and readable loading/error feedback.
- Add a compact home view with Resume escape, New story, Practice, Downloaded stories, Help and Settings. Show the saved story, operation and remaining resources before resuming. Keep the globe central to actual play.
- Make Practice, Help and all essential controls reachable on phones. The current mobile header hides some desktop entries.
- Show saved progress without starting its clock while browsing. Starting or resuming must be an explicit action with a clear running/paused state.

Acceptance: first launch, installation, home-screen relaunch and resume work on an Android phone and an iPhone. A new player can find the guide without desktop-only navigation.

## Phase 2 Offline downloads and safe updates

- Introduce a story download screen showing both required city packs, download sizes, progress, ready/failed status and Retry. Distinguish core atlas readiness from story readiness.
- Add a download manager with storage estimates and removal of unneeded packs. Preserve saves when a pack is removed and explain what must be downloaded again.
- Handle interrupted connections, insufficient space, unavailable browser storage and incomplete packs. Never label a story offline-ready until all required files are available and valid.
- Make first-time map loading responsive, with clear cancellation and no clock charge during setup.
- Offer an update notification rather than automatically reloading during play. Save first; apply an update at a safe point. Protect pending journeys, older saves and usable cached packs if installation fails.
- Keep optional satellite failure separate from core gameplay and return cleanly to vector maps.

Acceptance: download a two-city story, close the app, enable airplane mode and complete all five operations including its flight. Repeat with a failed download, denied storage and an update during travel. No false readiness indicator or lost save is acceptable.

## Phase 3 Progress protection and phone lifecycle

- Define and explain one policy for backgrounding and locking: planning time stops while hidden; an already committed journey settles its quoted resources exactly once. Verify this against existing behaviour before changing it.
- Preserve planning stops, selected transport, missions, items, intelligence, documents and active journeys across reloads and interruptions.
- Add versioned save export/import with validation, a readable backup description and confirmation before replacing an existing escape. Keep accounts and cloud services out of scope.
- Make storage failures visible on mobile. Do not claim Saved when a write fails. Explain that clearing browser data can remove both progress and maps.
- Prevent two tabs or two windows from silently overwriting the same run. Provide an active-session notice or a safe takeover flow.
- Confirm restart and destructive reset actions; make resume the easy default.

Acceptance: test interruptions before departure, during animation, during collection, after landing and at operation handoff. Time, cash, energy and items remain consistent with no duplicate settlement. Invalid imports leave the current save intact.

## Phase 4 Touch interface and route clarity

- Keep Go, both relevant deadlines, cash, energy and mission progress within easy reach. Reduce the mobile panel height when tasks are complete so the map retains useful space.
- Make the selected travel scope unmistakable: next leg, through a stop or whole route. Keep the planned cost, time and projected arrival readable near Go.
- Improve transport chooser, stop labels, overlapping markers and accidental map taps. Preserve click-again route removal while showing clearly which later legs will also disappear.
- Show leg numbers, transport symbols, route direction, completed travel and the next target with consistent graphics. Use labels and patterns as well as colour.
- Keep the player marker red. Reframe cleanly after flights and operation transitions, preserve intentional camera choices and offer an obvious recenter action.
- Explain blocked travel in plain language: what prevented it, what was charged, and which action can help. Make local clues useful without choosing the route for the player.
- Review every dialog with the keyboard open, portrait/landscape changes, large text and phone safe areas. Keep Help and Pause reachable.

Acceptance: at least five new players attempt the same opening operation without coaching. Target at least four completing route planning, an edit, a mission collection and onward travel independently. Record confusion and fix repeated problems before adding features.

## Phase 5 Story quality and balancing

- Audit all 50 stories for coherent names, mission locations, item order, optional supply placement and meaningful differences. Shared maps must not make every story feel like the same route with different text.
- Validate two complete winning strategies per story and explicit losing cases for deadlines, money, energy/rest, mission order and blocked travel where applicable. Validate pilot-specific document and timetable failures separately.
- Check that all five operations fit within the shared 24 hours and starting reserve, with understandable escalation. Distinguish genuine route restrictions from authored difficulty adjustments.
- Ensure airport pickups happen in a sensible sequence, optional supplies do not create misleading dead ends and no mandatory city return follows airport arrival without a clear story reason.
- Playtest The Shelter Keys before expanding intelligence, timetables or document checks. Improve stale-report warnings, departure/cutoff explanations and document feedback first.
- Improve operation handoff and ending screens with the collected items, time/cash/energy carried forward and a readable journey recap. Provide a clear next-story action.

Acceptance: catalogue validation passes; manually finish at least one story in each of the nine geographic corridors plus the pilot. Later-operation pressure feels earned and failure messages explain the game rule involved.

## Phase 6 Performance accessibility and release testing

- Measure initial launch, cached relaunch, map parsing, route calculation, animation smoothness and memory on actual devices. Establish baselines before committing to numerical performance targets.
- Reduce unnecessary map detail at distant zooms, load only the selected corridor and move expensive work off the main thread where measurements justify it. Test repeated story changes for memory growth and map-context loss.
- Add a low-detail/battery-friendly setting if needed. Preserve readable roads, crossings and mission markers in that mode.
- Verify touch target sizes, contrast, screen-reader names and focus order. Honour reduced motion and ensure essential information is available outside the map canvas.
- Maintain a device checklist: iPhone Safari and installed mode; Android Chrome and installed mode; a modest Android phone; tablet and desktop regression. Include orientation changes, airplane mode, weak connection, low storage and operating-system termination.
- Add suitable browser regression checks to CI where feasible. Keep deterministic rules separate from rendering and preserve map/font/vendor attribution.
- Keep Help, FAQ, wizard, privacy information and offline limitations consistent with the release. Describe fictional schedules and border rules accurately.

Acceptance: no unresolved release blockers; the checks below pass on the agreed devices. Cosmetic issues may enter a documented follow-up list.

## Home screen release checklist

- [ ] Installation, app icons, standalone launch, home view and resume verified on both phone platforms.
- [ ] One complete five-operation story playable offline after an explicit successful download.
- [ ] Both mission actions, Go, time, cash and energy remain easy to reach on supported screens.
- [ ] Locking, backgrounding, reloads and updates preserve progress and charge journeys once.
- [ ] Save backup/restore, storage failure and interrupted downloads tested.
- [ ] All story/rule validations and relevant browser regressions pass.
- [ ] Manual full-story checks cover all nine geographic corridors and the field-desk pilot.
- [ ] Physical-device usability, performance and accessibility issues reviewed and blockers resolved.
- [ ] Help, FAQ, credits and privacy information match actual behaviour.
- [ ] Changes committed, pushed and verified on the deployed GitHub Pages site, including an upgrade from the previous installed version.

## Work deferred until this release is stable

Native Android/iPhone packaging, store accounts, live world-event feeds, online accounts, multiplayer, new continents, extra stories, military/historical modes, and new transport without valid local networks are outside this milestone. Broader authored events, crossing-specific permissions, scenario editing and challenge-sharing remain future options after balancing and playtesting.

## First implementation batch

Start with installation icons and guidance, a compact Resume/New story home view, phone-accessible Help/Practice, and accurate core-versus-story offline readiness. Next address safe updates and lifecycle recovery before visual embellishments. Keep each batch small enough to test and review independently.

Development uses free tools, existing maps and GitHub Pages. Real iPhone and Android access is needed for final testing; do not claim phone readiness from desktop emulation alone. After every verified implementation batch, build, run the relevant checks, commit and push to the existing branch without publishing secrets, raw downloads or generated test screenshots.
