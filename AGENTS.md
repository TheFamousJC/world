# Development workflow

- Build one unnamed civilian route-survival game. Military and historical modes are out of scope for this release.
- Keep the first release free of paid services, API keys, runtime AI calls and required remote map dependencies. Optional user-selected free satellite imagery may use NASA GIBS; the core vector map and routing must work offline.
- Preserve source attribution and licences for all map data, fonts and vendor code.
- Keep deterministic game rules separate from rendering. Test resource accounting, route validity, saves and each scenario's winning and losing cases.
- At the end of every verified code update, commit and push this project's changes to `https://github.com/TheFamousJC/world`. This is a standing user instruction. Do not force-push or publish unrelated parent-directory files. If the push fails, retain the local commit and report the exact blocker.
- Use the repository's existing branch. Never commit secrets, raw source downloads, generated test screenshots or previous experimental prototypes.
