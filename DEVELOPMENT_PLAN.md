# Escape Atlas home screen development plan

Updated 25 October 2026 against version 0.21.0.

## Current priority Browser gameplay

Keep the browser game as the priority. The current interface has a timer with play/pause, money and energy, a collapsed Missions menu, contextual Go and a full-width key. OpenFreeMap dark vectors load online with automatic offline fallback. The five-slide introduction covers the core loop; mission collection leaves onward route choices to the player. Two full five-operation stories have browser playthrough coverage, including flights, document checks, resource carry-over and offline continuation. Physical-device testing remains necessary.

### Recommended next cycle

1. **Protect progress:** add save export/import and a recoverable restart, then test interrupted travel, refreshes and updates without duplicate charges.
2. **Polish the core loop on real devices:** observe new players on desktop, iPhone, Android and iPad; fix unclear collection, route editing, map labels and blocked-route recovery before adding panels.
3. **Improve story quality:** review the 50 stories for variety, travel budgets and progressively harder operations; add distinct consequences and endings to the strongest stories first.
4. **Finish offline/PWA delivery:** show download status and pack sizes, offer storage controls, and check installed launches, background/resume and performance on lower-powered phones.
5. **Pilot pursuit and intrigue:** validate the design below in one story before extending the catalogue. Music and effects now ship as an optional presentation layer.

### Audio shipped in 0.21.0

- Original procedural ambient score and cues for routing, travel, collection, rejection and endings. No recordings, streams, paid services, keys or runtime AI.
- Visible master mute, separate Music and Sound effects controls and a volume slider. Preferences are stored on the device; first use starts muted and audio unlocks only after player interaction.
- Music and ordinary effects stop when paused, when a dialog is open or when the tab is hidden. End-of-run cues may finish once; mute and hiding always silence them.
- Audio remains independent of deterministic game rules. Browser checks cover audible waveform generation, pause, mute, effects-only play, persistence, offline use and small-screen controls.

### Pursuit pilot: a fictional third party (proposal only)

**Premise:** a rival organisation wants to intercept your package. It follows traces of your journey rather than knowing your location automatically. The player remains a civilian traveller; no real-world location tracking or runtime AI is needed.

**State:** exposure, last-known area, confidence and age of intelligence, pursuer position, and response delay. Seeded rules keep the simulation reproducible and offline. Planning time and simulated travel advance the same world clock; pause freezes both player and pursuer. Save all pursuit state with the story.

**Fairness:** only authored in-game events create traces, such as a named ticket purchase, a document check or a compromised contact. The pursuer needs time and a valid graph route to respond. Show warnings and uncertain search areas before interception becomes possible. Avoid instantaneous closures, omniscient enemies and failures the player had no chance to anticipate.

**Counterplay:** choose a lower-exposure route, change transport, spend resources on a diversion, ask a trusted contact to verify a report, or accept extra travel time to reduce exposure. Each choice should trade time, money or energy for a clear potential advantage.

**Five-operation arc:**
1. Introduce one trace and a report with its source/time; allow a generous recovery window.
2. Add a compromised contact and a choice between speed and discretion.
3. A flight or rail connection creates a stronger trace; offer at least two viable onward options.
4. A useful ally has a competing need; helping them may unlock a later alternative.
5. Combine the established rules in a final handoff with several endings based on choices and survival.

**Interface:** put exposure details and intelligence inside Missions / Local knowledge. Use temporary map alerts and an approximate search area. Keep the timer, resources, Go, audio and key as the permanent controls. Do not add a permanent pursuit dashboard.

**Acceptance tests:** two distinct winning strategies and at least five authored losing/recovery cases; no teleporting; response only to known traces; consistent results for a shared seed; pause/reload/offline and operation carry-over retain pursuit state; every interception has a preceding understandable warning and a feasible response.

### Delivery order for excitement and replayability

1. Protect saves, add recoverable restarts and finish physical-device UX testing before adding more simultaneous systems.
2. Build the pursuit model in one authored five-operation story, starting with the first operation as a playable test. Observe whether players understand the consequences before adding the remaining operations.
3. Add trusted/unreliable contacts and optional companion or rescue objectives to that pilot. Choices should change later routes and the ending, not just add text.
4. Add seeded daily challenges, shareable challenge codes and an optional replay/ghost of a previous route. These can work without accounts or a paid backend.
5. Expand the strongest mechanics to selected stories after playtesting; retain simpler stories for new players. Human multiplayer is a later project, with separate hosting and fairness requirements.

### Other promising ideas

- A rival traveller competing for a limited departure, with forecasts rather than surprise seat loss.
- Packages with different needs (a delivery deadline, fragile contents, or evidence that can be checked at a contact) that create route trade-offs.
- Rumours with a source and age, conflicting accounts and verification choices using the existing intelligence system.
- A debrief explaining the consequences of key choices, plus survival, time, budget and help-given scores rather than shortest-route scoring alone.
- Optional personal ghost routes so players can improve on their own earlier attempt without making the main map busier.


## Release goal

Make Escape Atlas dependable and enjoyable as a game launched from an Android or iPhone home screen. A player should be able to install it, understand the rules, download a story, finish all five operations offline and return later without losing progress.

Keep the existing civilian game, free hosting and offline map routing. Finish this milestone before native packaging or more stories. The phases below are planned work, not completed features.

## Current foundation

- 50 stories with five operations and two ordered missions per operation, plus optional cash and energy contacts. The original ten practice challenges and legacy Nightfall campaign remain available.
- Detailed offline OpenStreetMap coverage for the Brest corridor and 16 worldwide mission cities with actual airport locations. Flights connect designated terminals.
- Custom map stops, transport quotes, route editing, animated travel, border checks, energy recovery, shared resources and local saves.
- A five-slide introduction, Help and FAQ, reduced motion, an online OpenFreeMap dark basemap with offline fallback, optional NASA satellite imagery and a compact responsive HUD.
- The Shelter Keys pilots uncertain intelligence, transport timetables and document checks. Those systems are not enabled across the whole catalogue.
- Automated rules, story validation and browser checks exist. Desktop Edge checks at phone widths do not replace testing installed Safari and Chrome on physical phones.

The installation manifest currently has one SVG icon, with no dedicated Apple touch icon or installation guide. Map caching exists, but there is no player-facing pack manager or save export/import. Release-aware update prompts now preserve saves and suppress same-version notices; pack management, export/import and physical-device lifecycle tests remain priorities.

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
