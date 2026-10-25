# Difficulty audit — shuttle advantage and courier pilot

Reproduce with `npm run audit:difficulty`. Uses the bundled Brest OpenStreetMap graph and deterministic game rules, without remote data. Covers the 10 local five-operation stories; worldwide flight stories are outside this sample. No existing story rules were changed.

## Existing local stories

| Main mode | Full-story wins | Mean winning minutes | Mean winning spend |
|---|---:|---:|---:|
| Shuttle | 10/10 | 777.7 | £75.7 |
| Taxi | 10/10 | 582.8 | £223.0 |
| Walk | 0/10 | — | £— |

The current shuttle serves nearly every named contact, with a fixed 12-minute wait and inexpensive per-distance fares. It uses little energy and usually supports an entire escape without needing first/last-mile choices. This sample confirms viability, not the fastest possible route: profiles visit the authored required contacts and then each destination; no optional bonuses or deliberate planning delay are included.

## New single-operation pilot: The sealed handoff

115-minute deadline, £18, 60% energy. Collect at Cycle workshop; explicitly deposit at Riverside aid point (six-minute handoff finished by T+75); retain a receipt and reach Northern pickup. Fixed shuttle stops are Central → North → Northern pickup, with 30-minute departures, eight-minute boarding and £4 per boarding. Quotes include all waiting and a known 15-minute document inspection if documents are still carried. The line follows the actual road graph via its intermediate stop.

| Profile | Wins | Minutes used | Money spent | Energy left | Outcome |
|---|---|---:|---:|---:|---|
| economy | true | 111 | £12 | 31% | Receipt accepted |
| flexible | true | 81 | £18 | 37% | Receipt accepted |
| allTaxi | false | 36 | £16 | 56% | money: This leg costs £10; you have £2. Change transport or shorten the plan. |
| allWalk | false | 70 | £0 | 32% | deadline: This leg would miss your final deadline. Find a faster route. |
| allShuttle | false | 0 | £0 | 60% | stop: This shuttle only serves Brest Central, Brest North and Northern pickup. Walk or take a taxi to or from the contact. |

Economy keeps a cash reserve but spends substantially more time reaching a shuttle stop and waiting. Flexible spends its entire reserve to finish sooner. Failing profiles show the actual constraint rather than an artificial mode ban. Planning time still counts, so the figures are lower bounds; the briefing and HQ show counter hours and service rules.

## Acceptance and limits

Tests cover at least two wins and the following failures/recovery checks: unserved shuttle contact, last departure missed, unaffordable taxi leg, walking deadline, premature final handoff, missing documents, late/wrong-location deposit, duplicate deposit, pending-save replay and receipt consistency. Failures before an action/departure charge nothing. Successful deposit atomically removes the document and adds its receipt. Neither the new pilot nor this audit implements pursuit, safe houses or dynamic police obstacles.
