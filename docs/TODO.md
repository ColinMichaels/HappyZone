# HappyZone TODO

This file tracks unfinished work and follow-up checks that are still worth doing after the current implementation and automated test pass.

## Verification And QA

- [ ] Run a manual screen-reader pass for the disclaimer modal, support modal, thought reframer, and calming tools disclosures.
- [ ] Run manual mobile-device QA in Safari on iPhone and Chrome on Android for keyboard overlap, sticky controls, and disclosure spacing.
- [ ] Run manual QA on delayed tooltips for icon-only controls to make sure hover/focus timing still feels discoverable without becoming noisy.
- [ ] Add a reduced-motion verification pass for the breathing orb and any animated transitions.

## Product And Content

- [ ] Review all support and crisis-resource copy with final product/legal/clinical guidance before wider release.
- [ ] Decide whether the header copy should be updated to the latest approved wording across the live UI and docs.
- [ ] Review the CBT heuristics for cognitive distortion detection and support-keyword matching with a human content reviewer.

## Data And Privacy

- [ ] Decide whether users need full export/import for local history before any broader rollout, not just one-way `.ics` export.

## Calendar And Reminder Roadmap

- [ ] Decide whether reminders should support recurrence, snoozing, or “done for today” behavior.
- [ ] Decide whether external calendar export should include only reminders or also journal entries by default.
- [ ] Evaluate whether browser notifications, a service worker, or native wrappers are worth the added complexity for real reminder delivery.
- [ ] Decide how reminder time zones should behave if the user exports in one zone and imports in another.

## Test And Tooling

- [ ] Consider adding coverage reporting so regression depth is easier to track over time.
