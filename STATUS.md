# TSI Site Status

Last updated: 2026-02-14
Latest verification: manual repository/state verification (`git status`, commit history, and key file inspection). No automated test suite currently configured for this static site.

## Milestone 0.1 - Core Site Foundation
- [Done] Main single-page site architecture with hash-tab sections (`index.html`).
- [Done] Shared styling and theme variables in `css/main.css`.
- [Done] Core client behavior in `js/main.js` (tab routing, modal open/close, section activation).
- [Done] Branding assets, logos, and static image structure under `assets/`.

## Milestone 0.2 - Stakeholder Intake (Digital Concierge)
- [Done] Concierge role selection flow with tier mapping and track capture in `index.html` and `js/main.js`.
- [Done] Tier-aware success messaging (`_021026_TIER_MESSAGES`) in `js/main.js`.
- [Done] Required field validation (name, email format, country, message).
- [Done] Timing guardrails (minimum submit delay, max wait handling, lockout during submit).
- [Done] Hold-to-clear interaction (2s) and visual state wiring.
- [Done] Submission metadata wiring (`submission_id`, `timestamp_local`, `page_path`, `referrer`).

## Milestone 0.3 - Legal, SEO, and Launch Baseline
- [Done] Legal pages created and linked: `privacy.html`, `terms.html`, `security.html`, `accessibility.html`.
- [Done] Privacy policy includes retention period (24 months) and deletion request contact.
- [Done] Privacy policy includes hosting/data-processing clarifications (GitHub Pages + Google Apps Script/Sheets flow).
- [Done] Custom `404.html`.
- [Done] Search index baseline (`sitemap.xml`, `robots.txt`).
- [Done] Favicon/link tags across primary pages.
- [Done] Footer/legal return-link consistency pass.
- [Done] Footer includes "All rights reserved." language.
- [Planned] Terms final entity/disclosure confirmation.
- [Planned] Funding/partnership disclosure confirmation (or explicit none).
- [Planned] Security controls verification (HTTPS + least-privilege Apps Script/Sheets access).
- [Planned] Image/brand rights confirmation (licenses and model releases).
- [Planned] Cookie-consent banner decision if non-essential cookies/analytics are introduced (Conditional).
- [Planned] Policy versioning/revision-history section decision (Conditional).

## Milestone 0.4 - Pipeline UI and Map Iteration
- [Done] Pipeline section refresh with ring-based corridor view (Option 5).
- [Done] Dual map mode in pipeline (MD-driven map + legacy PNG mode).
- [Done] Map rendering logic and overlay toggle controls in `js/main.js` (`initPipelineMap`).
- [Done] Map assets added: `assets/world-map.md`, `assets/world-map.png`, `assets/world-map.svg`.
- [Done] Map source artifact retained: `World_map_without_Antarctica.svg`.

## Milestone 0.5 - Team/Internal Experience
- [Done] Team tabbed layout and founder/community/operations panels in `index.html`.
- [Done] Internal portal simulation flow (email format/domain checks, failure messaging).
- [Done] Remote node gate page scaffold in `tsi_internal.html`.
- [Planned] Replace founder draft statement with final approved copy (`LAUNCH_TODO.md`).
- [Planned] Confirm final staff roles/headshots and cleanup placeholder references.

## Milestone 0.6 - Launch Readiness QA
- [Planned] Stakeholder form QA: concierge selection, required fields, email validation, 3s trap, hold-to-clear, and success/error states.
- [Planned] Concierge selection collapse QA (non-selected buttons hide smoothly after selection).
- [Planned] Modal behavior validation (open/close/outside-click/submit lockout/success transitions).
- [Planned] Navigation tabs validation (hash navigation, active states, focus styles).
- [Planned] Theme toggle and logo swap validation (dark/light).
- [Planned] Responsive layout review (mobile nav, modal scroll, form layout, staff grid).
- [Planned] Accessibility pass (keyboard/focus/contrast/ARIA/screen-reader order).
- [Planned] Link check across internal and legal pages.

## Milestone 0.7 - Launch Checklist Alignment (`LAUNCH_TODO.md`)
- [Planned] Replace draft founder letter in `index.html` with final approved copy.
- [Planned] Confirm final staff names/roles/headshots in `assets/hr/`.
- [Planned] Confirm production form endpoint and sheet capture behavior.
- [Planned] Snapshot/backup current build prior to launch.
- [Planned] Final content review and sign-off.

## Recent History (High-Level)
- [Done] 2026-02-11: Intake and internal portal behavior matured (validation, submission metadata, portal simulation).
- [Done] 2026-02-12: Legal/compliance docs and launch checklist work added.
- [Done] 2026-02-13: UI refinements and map asset preparation.
- [Done] 2026-02-14: Commit `3f647fd` completed major `021026` form logic and pipeline/map updates.
- [Done] 2026-02-14: Session cleanup confirmed repository reset/clean at `3f647fd`.

## Active Focus
- Keep scope tight to requested workstream.
- For map tasks, confine edits to:
  - `index.html` (pipeline section)
  - `css/main.css` (pipeline/map styles)
  - `js/main.js` (`initPipelineMap` and related map handlers)
  - `assets/world-map.*`

## Update Policy
- Use this file as the planning roadmap and progress tracker.
- Update statuses (`[Done]`, `[Planned]`, `[Blocked]`) when milestones materially change.
- Do not mark an item `[Done]` without verifiable repo evidence (diff, behavior check, or commit).
