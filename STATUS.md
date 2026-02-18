# TSI Site Status

Last updated: 2026-02-16
Latest verification: targeted Playwright pipeline/map smoke check on 2026-02-16 (local static server + browser run): section presence (`#overview`, `#pipeline`, `#engagement`, `#team`), MD map dot render, MD/legacy toggle behavior, override-dot presence, responsive checks at `900px` and `600px`, and browser console error capture.
Primary scope reference: `PRODUCT-PRD-BLUEPRINT.md`.

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

## Milestone 0.4 - Pipeline UI and Map Iteration
- [Done] Pipeline section refresh with ring-based corridor view (Option 5).
- [Done] Dual map mode in pipeline (MD-driven map + legacy PNG mode).
- [Done] Map rendering logic and overlay toggle controls in `js/main.js` (`initPipelineMap`).
- [Done] Added `# overrides` support in `assets/world-map.md`; override cells now apply with priority before toggle markers render (`js/main.js` parser flow), with optional per-cell `color` and `blink` (including no-color blink shorthand).
- [Done] Rolled map behavior back to baseline: removed in-page map effect controls and experimental load-animation runtime paths, while preserving MD-driven render, MD/legacy independent toggle controls, and single-cell override styling/blink support.
- [Done] Added coordinate-set override batching syntax for grouped points, including block set definitions (`$set={ ... }`) and equals-style set payload application (`@set=...`) alongside existing inline/pipe forms.
- [Done] Added color-transition override animation path (base terrain color -> target color -> base), now exposed via `blink=glow`.
- [Done] Restored `fade` to standard pulse behavior and introduced `glow` mode for base-terrain-to-target color transitions on overrides.
- [Done] Added dual-color override payload support so `glow` can transition `color1 -> color2 -> color1` (or base->color when only one color is provided).
- [Done] Increased `glow` baseline brightness so `color1` is visibly bright at animation start/end.
- [Done] Reverted `glow` to prior low-floor effect and added `blend` mode for full-opacity color1<->color2 transitions.
- [Done] Added override color-token normalization for bare hex values (for example `6b7385` -> `#6b7385`) to prevent SVG fallback-to-black on missing `#`.
- [Done] Added theme-aware Texas override color tokens (`--map-texas-color-1/2`) and switched Texas override to use CSS variables for automatic light/dark compatibility.
- [Done] Removed Pipeline Option 5 ring diagram from UI and styles; pipeline now presents map-focused content in that section.
- [Done] Aligned MD toggle markers to cell centers for integer `x|y` coordinates, fixing offset markers rendering in the lower-right quadrant of target points.
- [Done] Disabled standalone legacy PNG map generation/display while retaining code paths and MD fallback-to-PNG behavior.
- [Done] Fixed theme switching for map base colors and active nav tab background by replacing hard-coded values with light/dark CSS tokens.
- [Done] Reduced map frame border weight and set light-theme border color to page background for a minimal map-frame edge in light mode.
- [Done] Flattened light-theme map frame styling (`border: 0`, background = page background) to remove the remaining visible medium-gray frame.
- [Done] Retuned light-theme map palette to reduce washed-out brightness (darker ocean/water/land tones plus subtle tinted frame background).
- [Done] Re-aligned light-theme map colors to dark-theme logic (ocean darkest, water mid, land lightest) using a dark-adjacent palette for visual consistency.
- [Done] Added map-specific accent token and brightened light-theme map accent to improve toggle/marker visibility against the updated light map palette.
- [Done] Map assets added: `assets/world-map.md`, `assets/world-map.png`, `assets/world-map.svg`.
- [Done] Map source artifact retained: `World_map_without_Antarctica.svg`.

## Milestone 0.5 - Team/Internal Experience
- [Done] Team tabbed layout and founder/community/operations panels in `index.html`.
- [Done] Internal portal simulation flow (email format/domain checks, failure messaging).
- [Done] Remote node gate page scaffold in `tsi_internal.html`.

## Milestone 0.6 - Launch Readiness QA
- [Planned] Complete the pipeline page map implementation and final readiness pass.
- [Planned] Review override color choices in both dark/light themes for contrast and readability consistency.
- [Planned] Stakeholder form QA: concierge selection, required fields, email validation, 3s trap, hold-to-clear, and success/error states.
- [Planned] Concierge selection collapse QA (non-selected buttons hide smoothly after selection).
- [Planned] Modal behavior validation (open/close/outside-click/submit lockout/success transitions).
- [Planned] Navigation tabs validation (hash navigation, active states, focus styles).
- [Planned] Theme toggle and logo swap validation (dark/light).
- [Planned] Responsive layout review (mobile nav, modal scroll, form layout, staff grid).
- [Planned] Accessibility pass (keyboard/focus/contrast/ARIA/screen-reader order).
- [Planned] Link check across internal and legal pages.

## Milestone 0.7 - Content + Compliance Sign-off (`LAUNCH_TODO.md`)
- [Planned] Replace draft founder letter in `index.html` with final approved copy.
- [Planned] Confirm final staff names/roles/headshots in `assets/hr/`.
- [Planned] Terms final entity/disclosure confirmation.
- [Planned] Funding/partnership disclosure confirmation (or explicit none).
- [Planned] Security controls verification (HTTPS + least-privilege Apps Script/Sheets access).
- [Planned] Image/brand rights confirmation (licenses and model releases).
- [Planned] Cookie-consent banner decision if non-essential cookies/analytics are introduced (Conditional).
- [Planned] Policy versioning/revision-history section decision (Conditional).
- [Planned] Final content review and sign-off.

## Milestone 0.8 - Launch Operations + Repo Hardening
- [Planned] Confirm production form endpoint and sheet capture behavior.
- [Planned] Snapshot/backup current build prior to launch.
- [Planned] Asset inventory and naming normalization pass (global vs page-scoped), including favicon/app icon completeness and archive of unused variants.
- [Planned] Apply asset naming convention rollout for page-scoped vs global assets and update references.
- [Planned] Repository privacy hardening for local-only operational docs and Apps Script backend (`form-backend/`) before public release.
- [Done] Documented required Codex launch mode in `AGENTS.md` (`codex -a never -s danger-full-access`) for low-interruption autonomous execution.
- [Done] Updated clean-exit commit policy in `AGENTS.md` to be conditional on `STATUS.md` status transitions during the session.
- [Done] Documented repository-root execution scope in `AGENTS.md` (`C:\dev\tsi\tsi-site-repo` default; non-repo access only by explicit request/permission).
- [Done] Added product blueprint source-of-truth alignment and risk reclassification guidance in `AGENTS.md`.
- [Done] Added `PRODUCT-PRD-BLUEPRINT.md` to define approved scope, MVP boundaries, and deferred work.
- [Blocked] Codex execution-permissions profile alignment in local `~/.codex/config.toml` (write denied by ACL in current runtime).
- [Blocked] Local ACL cleanup for blocked file operations (`temp`, `.git` index write restrictions); requires elevated OS terminal with ownership privileges.

## Risk Register (Living)
- [Open] `R-001` Map behavior regressions while supporting dual-mode overlays, switch semantics, and flexible MD parsing.
  - Affects: `0.6` launch readiness QA.
  - Validation needed: manual browser checks for multi-switch behavior, hover label behavior, and responsive behavior at `900px` / `600px`.
  - Rollback checkpoint: next in-scope map commit hash.

## Recent History (High-Level)
- [Done] 2026-02-11: Intake and internal portal behavior matured (validation, submission metadata, portal simulation).
- [Done] 2026-02-12: Legal/compliance docs and launch checklist work added.
- [Done] 2026-02-13: UI refinements and map asset preparation.
- [Done] 2026-02-14: Commit `3f647fd` completed major `021026` form logic and pipeline/map updates.
- [Done] 2026-02-14: Session cleanup confirmed repository reset/clean at `3f647fd`.
- [Done] 2026-02-14: Pipeline map control paths split by mode (legacy vs MD), MD parser reliability fixes applied, and MD toggle labels aligned to corridor names.
- [Done] 2026-02-14: Pipeline map responsiveness improved for `900px`/`600px` breakpoints with adaptive label density and mobile-sized controls.
- [Done] 2026-02-14: MD parser now tolerates missing `# toggles` header by inferring toggle rows from pipe-delimited lines.
- [Done] 2026-02-16: MD parser now supports `# overrides` (`x|y|value|color|blink`) so base rows load first, overrides apply by priority, then toggle logic runs.
- [Done] 2026-02-16: Override blink now supports no-color shorthand (`x|y|value|blink`) and stronger dot-pulse visibility for base-map overrides.
- [Done] 2026-02-16: Added startup transition that flickers random land dots on map render, with density taper to minimize animation overhead.
- [Done] 2026-02-16: Added desynced all-land fade overlay and increased/slowed random flicker density for richer map boot effect.
- [Done] 2026-02-16: Added test-effect trigger buttons and new runtime effects (`Drift Field`, `Scan Sweep`, `Full Sequence`) for map animation validation.
- [Done] 2026-02-16: Limited runtime effects to MD map and added compact/tiny/reduced-motion quality profiles with drift sampling to reduce animation load.
- [Done] 2026-02-16: Retired startup dot-level flicker/drift; load visuals now use only whole-map fade + scan sweep for minimal overhead.
- [Done] 2026-02-16: Added five deterministic dot-level reveal patterns with bounded durations and cleanup for realistic load-in testing.
- [Done] 2026-02-16: Removed `Load Reveal` and `Scan Sweep`; baseline now runs with no automatic load animation and improved measured initial map render timing.
- [Done] 2026-02-16: Reverted map from animation-test state back to core baseline; removed test-effect controls and effect runtime code while retaining MD file loading, toggle controls, and `# overrides` behavior.
- [Done] 2026-02-16: Override parser now accepts `random` blink mode for `# overrides`; each `random` override resolves to `rapid`/`slow`/`fade` during dot render.
- [Done] 2026-02-16: Updated MD override parser so `value` is optional (`x|y|color|blink` and blink-only shorthand supported), while preserving legacy `x|y|value|color|blink`; helper text in `assets/world-map.md` updated to match.
- [Done] 2026-02-16: Added optional override phase token (`sync|async`) with default `sync`; async blink now applies per-dot phase offsets while preserving shared blink style.
- [Done] 2026-02-16: Added override coordinate-set variables in `# overrides` (`$set_name=...` define, `@set_name|...` apply) so one payload can be applied across a contained list of coordinates.
- [Done] 2026-02-16: Extended override coordinate-set syntax to also accept block definitions (`$set_name={ ... }` with `x|y|` lines) and equals-style application (`@set_name=|...`) for grouped override payloads.
- [Done] 2026-02-16: Updated override fade behavior so `blink=fade` with a color transitions base terrain color -> target color -> base; helper text updated in `assets/world-map.md`.
- [Done] 2026-02-16: Reassigned color-transition behavior from `fade` to new `glow` blink mode; `fade` now uses original pulse output again.
- [Done] 2026-02-16: Extended override parser/render path to accept optional second color token (`color1|color2`) with `glow` transition semantics; helper text updated with two-color formats/examples.
- [Done] 2026-02-16: Tuned `mapDotPulseGlow` keyframes to raise low-end opacity and glow intensity, fixing dim `color1` at phase boundaries.
- [Done] 2026-02-16: Reverted `mapDotPulseGlow` to previous profile and introduced `blend` blink mode for stable-brightness color transitions (`color1 <-> color2`) without glow dimming.
- [Done] 2026-02-16: Updated override color parsing to auto-prefix bare hex tokens with `#`, fixing black fallback when hex colors are entered without hash.
- [Done] 2026-02-16: Added dark/light-specific Texas map color variables in `css/main.css` and updated Texas override line in `assets/world-map.md` to reference `var(--map-texas-color-1/2)`.
- [Done] 2026-02-17: Removed Option 5 ring block from `index.html` and cleaned unused ring-diagram CSS from `css/main.css`; map section label simplified to `Map`.
- [Done] 2026-02-17: Updated MD toggle marker placement so integer coordinates center on cells (`+0.5`), resolving marker center misalignment vs designated map points.
- [Done] 2026-02-18: Marked legacy PNG map block as disabled/hidden and excluded disabled maps from render/setup loops in `initPipelineMap`; MD map fallback path remains intact.
- [Done] 2026-02-18: Added theme tokens for map ocean/water/land colors and tab-active background in `css/main.css`; updated map styles and JS base-fill fallback to use those tokens so dark/light switching applies correctly.
- [Done] 2026-02-18: Updated `.pipeline-map-frame` border to a thinner, softened stroke and set light-theme border color to `var(--page-bg)` for near-invisible light-mode framing.
- [Done] 2026-02-18: Updated light-theme `.pipeline-map-frame` override to remove border entirely and use `var(--page-bg)` background, eliminating residual frame contrast.
- [Done] 2026-02-18: Adjusted light-theme map token values (`--map-ocean-fill`, `--map-dot-water`, `--map-dot-land`) and set a muted light frame background to improve contrast and reduce glare.
- [Done] 2026-02-18: Updated light-theme map tokens again to mirror dark-theme tonal ordering more closely while preserving theme differentiation.
- [Done] 2026-02-18: Introduced `--map-accent` and mapped map control active state, overlay accent markers, and `accent` parser token resolution to `var(--map-accent)`; set light-mode value to a higher-contrast blue.

## Active Focus
- Keep scope tight to requested workstream.
- For map tasks, confine edits to:
  - `index.html` (pipeline section)
  - `css/main.css` (pipeline/map styles)
  - `js/main.js` (`initPipelineMap` and related map handlers)
  - `assets/world-map.*`

## Update Policy
- Use this file as the planning roadmap and progress tracker.
- Keep scope aligned with `PRODUCT-PRD-BLUEPRINT.md`.
- Reclassify active risk entries after validation/user confirmation (`Remove`, `Downgrade`, `Keep`, `Escalate`) before starting the next work cycle.
- Update statuses (`[Done]`, `[Planned]`, `[Blocked]`) when milestones materially change.
- Do not mark an item `[Done]` without verifiable repo evidence (diff, behavior check, or commit).
