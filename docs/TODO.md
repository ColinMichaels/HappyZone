# HappyZone TODO

This file tracks unfinished work and follow-up checks that are still worth doing after the current implementation and automated test pass.

## Verification And QA

- [ ] Run a manual screen-reader pass for the disclaimer modal, support modal, thought reframer, and calming tools disclosures.
- [ ] Run manual mobile-device QA in Safari on iPhone and Chrome on Android for keyboard overlap, sticky controls, and disclosure spacing.
- [ ] Add Playwright coverage for the breathing reset and grounding guide interactions, not just the reframer entry point.
- [ ] Add a reduced-motion verification pass for the breathing orb and any animated transitions.

## Product And Content

- [ ] Review all support and crisis-resource copy with final product/legal/clinical guidance before wider release.
- [ ] Decide whether the header copy should be updated to the latest approved wording across the live UI and docs.
- [ ] Review the CBT heuristics for cognitive distortion detection and support-keyword matching with a human content reviewer.

## Data And Privacy

- [ ] Add a user-facing way to clear all saved local check-ins and support-related preferences from the UI.
- [ ] Decide whether users need export/import for local history before any broader rollout.
- [ ] Document the localStorage keys and retention behavior in more detail if external contributors will work on persistence.

## Test And Tooling

- [ ] Consider adding coverage reporting so regression depth is easier to track over time.
- [ ] Consider adding one CI build step for `npm run build` if deployment regressions become a recurring issue.
