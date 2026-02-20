# Codex Session History

## Date
- Session date: February 14, 2026

## Summary
- Initial active topic had been map/pipeline behavior.
- A later request asked for a new `021026_Staff_Gateway` page with founder letter and circular staff profiles.
- During that work, scope drift occurred away from map-only focus.
- No tracked files were changed during the drift; only two untracked placeholder images were created:
  - `assets/hr/021026_elena.png`
  - `assets/hr/021026_lisa.png`

## Troubleshooting Performed
- Verified latest commit:
  - Commit: `3f647fdd89987816c7f27b9df4b57c1de26f1152`
  - Time: `2026-02-14T10:27:15-06:00`
  - Message: `Completed 021026_form-logic`
- Confirmed current branch:
  - `021026_master`
- Compared behavior to commit contents:
  - Map/pipeline changes were introduced in `3f647fd`.
  - The same commit also included unrelated non-pipeline edits (legal link updates, snapshot docs, etc.).
- Confirmed git cannot reconstruct true intra-commit time order of individual hunks.

## Resolution Applied
- Removed the two untracked placeholder files.
- Confirmed repo state is clean and aligned to commit `3f647fd`.

## Current Confirmed State
- Branch: `021026_master`
- HEAD: `3f647fd`
- Working tree: clean (`git status` showed no changes)

## Notes for Next Session
- If resuming map work, keep scope restricted to pipeline/map files:
  - `index.html` (pipeline section)
  - `js/main.js` (`initPipelineMap`)
  - `css/main.css` (pipeline/map styles)
  - `assets/world-map.md` and map assets

## Live Session Entries
### 2026-02-14 11:24:10 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added governance/coordination docs (`AGENTS.md`, `STATUS.md`, `PACKETS.md`), renamed session log to `AGENTS-LOG.md`, deleted legacy launch/overnight docs, and pushed commit `34f5a95` to `021026_master`.
- Troubleshooting suggestions: If a push is rejected with remote ref lock/expected-hash mismatch, run `git fetch`, verify local/remote heads, then retry push once refs converge.
- Resolutions/outcomes: Repo tracking docs are now centralized and committed; session-close protocol and packet boundaries are documented.

### 2026-02-14 11:28:23 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Committed and pushed unclean-exit detection/tail-marker protocol updates in `AGENTS.md` and `AGENTS-LOG.md`.
- Troubleshooting suggestions: If a future session starts and the active tail marker is still present at EOF, treat it as unclean shutdown, append recovery note, and choose one of the documented restart paths.
- Resolutions/outcomes: Commit `588a5e6` pushed to `origin/021026_master`; clean close protocol executed and active-session tail marker cleared.
- Commit hash(es): `588a5e6` (this packet), prior related docs baseline `34f5a95`.
- Push result: `origin/021026_master` updated successfully.

[AGENTS-LOG-TAIL] CLEAN_EXIT_CONFIRMED 2026-02-14 11:28:23 -06:00

### 2026-02-14 14:08:13 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added explicit launch mode guidance to `AGENTS.md` (`codex -a never -s danger-full-access`), updated planning states in `STATUS.md`, and attempted requested permission/ACL actions on `temp`, `.git`, and local Codex config.
- Troubleshooting suggestions: Run one elevated OS terminal pass to remove deny ACL entries and delete `temp`; then launch Codex with `-a never -s danger-full-access` for no-approval operation in future sessions.
- Resolutions/outcomes: Execution mode is now documented in governance policy; permission and ACL changes remain blocked in this runtime due OS-level access denial.
- Commit hash(es): none

[AGENTS-LOG-TAIL] CLEAN_EXIT_CONFIRMED 2026-02-14 14:08:13 -06:00

### 2026-02-14 14:13:21 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added explicit clean-exit commit requirement to `AGENTS.md`, applied website/global icon wiring and asset-case/path corrections, updated `.gitignore`, created `site.webmanifest`, and aligned `STATUS.md` completion/blocked states.
- Troubleshooting suggestions: Run ACL remediation in an elevated OS terminal to remove deny entries on `.git`, delete tracked `temp`, and enable reliable automated file/index operations.
- Resolutions/outcomes: Clean-exit protocol executed and required commit was attempted, but blocked by `.git/index.lock` permission denial (`fatal: Unable to create ... index.lock: Permission denied`); push not requested.
- Commit hash(es): none (commit blocked)

[AGENTS-LOG-TAIL] CLEAN_EXIT_CONFIRMED 2026-02-14 14:13:21 -06:00

### 2026-02-14 14:35:17 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reviewed governance risks under `danger-full-access`, then updated `AGENTS.md` to enforce repo-root default execution scope and conditional clean-exit commit logic based on `STATUS.md` status transitions; aligned `STATUS.md` completed items.
- Troubleshooting suggestions: If non-repo path operations are needed, explicitly include target path and intent in the prompt so they are clearly in-scope.
- Resolutions/outcomes: Governance policy now matches private single-user workflow: repo path is primary writable scope, non-repo access requires explicit request/permission, and clean-exit commit is required only when `STATUS.md` item statuses changed.
- Commit hash(es): none

### 2026-02-14 14:41:57 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reorganized `STATUS.md` by moving all `[Planned]` items from milestones before `0.6` (`0.3` and `0.5`) into milestone `0.6`, and added pipeline map completion as the first `0.6` planned item.
- Troubleshooting suggestions: If milestone lists start duplicating ownership/content, keep milestone-specific detail in one milestone only and use cross-references to avoid drift.
- Resolutions/outcomes: Milestones `0.3` and `0.5` now contain only completed items; milestone `0.6` is the unified pending checklist with pipeline map completion at the top.
- Commit hash(es): none

### 2026-02-14 15:11:39 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reviewed newly consolidated planned items for redundancy and logically redistributed future work in `STATUS.md`: kept `0.6` QA-only, moved content/legal/policy decisions into `0.7`, and created `0.8` for launch operations and repo hardening.
- Troubleshooting suggestions: Re-run this categorization whenever new planned items are added; default rule should be QA in `0.6`, sign-off decisions in `0.7`, operational hardening in `0.8`.
- Resolutions/outcomes: Removed duplicate founder/staff planning lines across milestones and improved sequencing clarity for execution order after QA.
- Commit hash(es): none

### 2026-02-14 15:15:31 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Started Packet B map work by fixing `initPipelineMap` MD parser behavior in `js/main.js` (corrected escaped regex patterns, narrowed toggle-section header match, and removed brittle early return on pre-existing map buttons), then updated `assets/world-map.md` toggle definitions to meaningful corridor labels.
- Troubleshooting suggestions: Keep the `# toggles` section header exact in `assets/world-map.md`; metadata/comment lines may include the word "toggles" but should not be treated as section boundaries.
- Resolutions/outcomes: MD-based map parsing now resolves expected `181x89` rows and 3 valid toggles, enabling stable control generation for U.S., Latin America, and Southeast Asia overlays.
- Commit hash(es): none

### 2026-02-14 15:16:52 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Fixed legacy PNG map toggle binding by introducing a dedicated legacy controls selector (`pipeline-map-controls--legacy`) in `index.html` and wiring `initPipelineMap` to that selector in `js/main.js`.
- Troubleshooting suggestions: Keep MD and legacy controls explicitly namespaced to avoid selector collisions as map modes evolve.
- Resolutions/outcomes: Legacy map control listeners now target the intended button group instead of the MD controls container.
- Commit hash(es): none

### 2026-02-14 15:22:30 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Completed map-mode separation per request by adding explicit legacy control metadata in `index.html` (`data-map-controls=\"legacy\"`) and refactoring `initPipelineMap` in `js/main.js` so legacy control binding and MD toggle generation are isolated (`bindLegacyToggleControls`, `resolveMdControls`, `applyMdToggleData`).
- Troubleshooting suggestions: For future map expansion, keep each map mode on unique `data-map-controls` values to avoid accidental cross-wiring when adding new toggle groups.
- Resolutions/outcomes: MD toggle buttons are now sourced dynamically from `assets/world-map.md` and resolved through MD controls only; legacy toggle logic no longer handles or targets MD controls.
- Commit hash(es): none

### 2026-02-14 15:35:17 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated MD toggle parsing/grouping in `js/main.js` to support `Toggle Category|Title|x|y|shape|color|size|blink` while keeping backward compatibility with legacy `Title|x|y|shape|color|size|blink`; implemented deduplicated button generation by first field and grouped marker rendering so one button controls all matching entries.
- Troubleshooting suggestions: Keep first field stable for each category (button key); changing capitalization/punctuation changes the generated target class and produces a separate button group.
- Resolutions/outcomes: Duplicate category names in `assets/world-map.md` now produce a single button (first occurrence label retained) and activate all markers in that category together.
- Commit hash(es): none

### 2026-02-14 16:08:27 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented responsive map behavior for changing resolutions by adding map size-class logic in `js/main.js` (`ResizeObserver` with `map--compact` at `<900px` and `map--tiny` at `<600px`) and corresponding style rules in `css/main.css` (reduced label density, hidden labels on tiny maps, improved mobile control tap sizing, and fixed map frame aspect ratio).
- Troubleshooting suggestions: If mobile labels need to remain visible, relax the `map--tiny` text-hide rule and shorten per-marker titles in `assets/world-map.md` to avoid overlap.
- Resolutions/outcomes: Map rendering now adapts to viewport/container width while preserving both legacy and MD toggle interaction paths.
- Commit hash(es): none

### 2026-02-14 16:37:18 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Tuned full-resolution map overlay label typography in `css/main.css` by reducing default label size/spacing (`5px`, `0.45px`) and compact-mode size/spacing (`4.5px`, `0.3px`) for better visual balance.
- Troubleshooting suggestions: If labels still feel dense after this change, reduce per-marker title length in `assets/world-map.md` before lowering font size further.
- Resolutions/outcomes: Full-resolution map labels are less dominant while preserving readability and existing responsive behavior.
- Commit hash(es): none

### 2026-02-14 16:41:14 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented marker-hover label visibility behavior by introducing `.map-marker` grouping in both generated MD overlays (`js/main.js`) and legacy overlays (`index.html`), then adding hover-capable-device CSS rules in `css/main.css` to hide labels by default and reveal them on marker hover.
- Troubleshooting suggestions: If desktop users report flicker while moving between marker and label, increase hover reveal transition duration slightly (for example `0.25s-0.3s`) or offset labels farther from markers.
- Resolutions/outcomes: On mouse/trackpad devices, labels now appear only when hovering a marker; touch devices retain non-hover behavior.
- Commit hash(es): none

### 2026-02-14 16:50:07 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Converted pipeline map toggle controls to independent switch behavior in `js/main.js` for both legacy and MD map modes: control clicks now invert only the targeted overlay/button state instead of forcing single-select behavior.
- Troubleshooting suggestions: If you need at least one switch always enabled, add a guard in the click handler that blocks deactivating the last active overlay.
- Resolutions/outcomes: Multiple map overlays can now be on simultaneously; first listed remains active by default until manually deactivated by the user.
- Commit hash(es): none

### 2026-02-14 17:03:07 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated MD parser logic in `js/main.js` so `# toggles` header is optional; parser now auto-classifies non-comment binary lines as map rows and `|`-delimited lines as toggle rows.
- Troubleshooting suggestions: Keep helper text prefixed with `#`; plain non-comment lines that are neither binary rows nor `|` toggle lines will be ignored with a parser warning.
- Resolutions/outcomes: Removing `# toggles` no longer breaks toggle rendering; toggle definitions continue loading as long as they remain pipe-delimited.
- Commit hash(es): none

### 2026-02-16 00:06:01 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Applied low-risk governance alignment updates from template logic: added product blueprint source-of-truth and risk lifecycle rules in `AGENTS.md`, created `PRODUCT-PRD-BLUEPRINT.md`, and aligned `STATUS.md` with blueprint/risk-register policy.
- Troubleshooting suggestions: Keep `PRODUCT-PRD-BLUEPRINT.md` concise and update it before any material scope shifts, then mirror those changes into `STATUS.md`.
- Resolutions/outcomes: Workflow preserved (`PACKETS.md` remains concurrency authority) while adding explicit risk reclassification, rollback-aware tracking, and product-scope alignment controls.
- Commit hash(es): none

### 2026-02-16 01:00:49 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated `js/main.js` map MD parser to support a dedicated `# overrides` section and apply `x|y|value` cell overrides after base-row load but before toggle parsing/rendering; documented override syntax in `assets/world-map.md`; updated `STATUS.md` to track this map milestone progress.
- Troubleshooting suggestions: Keep override lines in bounds (`0 <= x < width`, `0 <= y < height`) and use only `0` or `1`; invalid/out-of-range entries are ignored with console warnings.
- Resolutions/outcomes: Single-file map workflow now supports persistent base-map adjustments with override priority while preserving existing toggle controls and format.
- Commit hash(es): none

### 2026-02-16 01:10:21 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added expanded `# overrides` helper text to `assets/world-map.md` (coordinate system, bounds, priority semantics) and inserted three active override entries (`56|28|0`, `62|58|0`, `132|38|0`).
- Troubleshooting suggestions: Keep override entries above `# toggles` and continue prefixing non-data helper lines with `#` so parser mode stays deterministic.
- Resolutions/outcomes: Override authoring guidance is now in-file and three working override points are live; verification confirmed all three entries replace base water cells (`1`) with land (`0`).
- Commit hash(es): none

### 2026-02-16 01:18:14 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Extended MD override parser in `js/main.js` to accept optional `color` and `blink` fields (`x|y|value|color|blink`), applied override style rendering to base dots, added corresponding blink classes in `css/main.css`, and updated `assets/world-map.md` helper text/examples with working color+blink override entries.
- Troubleshooting suggestions: Use only `rapid|slow|fade` for override blink values; invalid blink tokens are ignored with a console warning while the coordinate/value override still applies.
- Resolutions/outcomes: Overrides now support both terrain-value changes and per-cell visual emphasis independent of toggle controls.
- Commit hash(es): none

### 2026-02-16 01:32:57 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added no-color blink compatibility in `js/main.js` for override shorthand (`x|y|value|blink`), strengthened override-dot pulse visibility via dedicated keyframes in `css/main.css`, and documented/updated no-color examples in `assets/world-map.md`.
- Troubleshooting suggestions: If blink still appears too subtle on a specific display, use `rapid` and/or pair with a bright color token to increase contrast against map base tones.
- Resolutions/outcomes: Override blink now works when color is intentionally omitted (`||blink` or shorthand `|blink`) and is easier to see on base map dots.
- Commit hash(es): none

### 2026-02-16 01:47:38 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added simulated map loading transition in `js/main.js` that flickers random land dots on render with tapering density and automatic cleanup; added `mapBootFlicker` styling in `css/main.css`; recorded progress in `STATUS.md`.
- Troubleshooting suggestions: Keep the transition opacity-only for scale; if density feels too high/low, tune `MAP_LOAD_FLICKER_RATIO_START` and `MAP_LOAD_FLICKER_RATIO_END` first.
- Resolutions/outcomes: Pipeline maps now boot with a transient random land-dot flicker effect while avoiding continuous heavy animation load.
- Commit hash(es): none

### 2026-02-16 01:54:03 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Tuned map boot effect in `js/main.js` by slowing flicker cadence, increasing active-dot coverage, and adding randomized all-land fade timing; added `mapBootFade` class/keyframes in `css/main.css` for out-of-sync full-land startup fade behavior.
- Troubleshooting suggestions: If startup appears too busy, lower `MAP_LOAD_FLICKER_RATIO_START` first; if too subtle, increase `MAP_LOAD_FLICKER_MS` and keep fade duration spread wide for desync.
- Resolutions/outcomes: Startup now blends broader random flicker with desynced global land fading for a richer, slower-loading visual.
- Commit hash(es): none

### 2026-02-16 01:59:19 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added map animation test controls in `index.html` (`Boot Flicker`, `Drift Field`, `Scan Sweep`, `Full Sequence`, `Stop Effects`), wired trigger handlers in `js/main.js` with safe timer cleanup and per-map effect stops, and added new effect styles/keyframes in `css/main.css` (`mapDriftField`, `mapScanSweep`).
- Troubleshooting suggestions: If an effect appears to retrigger unexpectedly after button changes, verify pending sequence timers are cleared via `clearMapSequenceTimers` before starting the next effect.
- Resolutions/outcomes: Map effects can now be triggered on demand for QA, including two new visual modes plus a chained full-sequence test path.
- Commit hash(es): none

### 2026-02-16 02:21:57 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Optimized map animation performance in `js/main.js` by restricting runtime effects to MD map only, adding adaptive effect profiles by viewport/reduced-motion (`getMapEffectProfile`), and sampling drift-field participants via `pickRandomSubset`; clarified test-control label scope in `index.html`.
- Troubleshooting suggestions: If effects still feel heavy on a target device, reduce `bootRatioStart`/`driftActiveRatio` in the tiny/compact profiles before shortening durations.
- Resolutions/outcomes: Visual test effects now avoid duplicate rendering on legacy PNG map and scale effect density/duration down automatically on smaller or reduced-motion contexts.
- Commit hash(es): none

### 2026-02-16 02:44:15 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reworked map-load visuals to lightweight mode in `js/main.js` by removing startup dot-level flicker/drift routines from runtime path, adding `runMapLoadLite` (`Fade In` + `Scan Sweep`), and remapping test controls in `index.html` to `Load Reveal`, `Scan Sweep`, `Fade In`, `Full Sequence`, `Stop Effects`; simplified supporting styles in `css/main.css`.
- Troubleshooting suggestions: If load still feels slow on a specific machine, the remaining bottleneck is map dot rendering itself; next step is reducing rendered dot count or disabling legacy map dot rendering outside explicit test mode.
- Resolutions/outcomes: Load effects now avoid per-dot startup animations and settle quickly; post-boot check confirms no active effect classes remain.
- Commit hash(es): none

### 2026-02-16 03:29:14 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added five new dot-level load-in test effects in `js/main.js` with deterministic delay models (`dot-split`, `dot-lanes`, `dot-diagonal`, `dot-ripple`, `dot-random`), added matching controls in `index.html`, and added one-shot reveal styling/keyframes in `css/main.css` (`map-dot--reveal-pending`, `mapDotRevealIn`) with bounded cleanup.
- Troubleshooting suggestions: These effects are one-shot and should not run continuously; if the visual appears to end too quickly, increase `MAP_DOT_REVEAL_MS` or per-pattern delay ranges in `computeDotRevealDelay`.
- Resolutions/outcomes: Five additional dot-driven load effects are available for manual QA while keeping runtime bounded by staged delays and automatic class cleanup.
- Commit hash(es): none

### 2026-02-16 09:00:48 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed `Load Reveal` and `Scan Sweep` controls from `index.html`, removed scan/load runtime paths from `js/main.js` (including automatic startup load animation calls), and removed scan-specific CSS in `css/main.css`; executed before/after Playwright benchmarks for load timing comparison.
- Troubleshooting suggestions: Remaining startup cost is dominated by SVG dot generation for both maps; if load still feels slow on target devices, next step is disabling or deferring legacy map dot rendering.
- Resolutions/outcomes: Baseline now has no automatic load animation; measured improvement from pre-change sample (`time_to_md_dots_ms` `1640.50` -> post-change avg `1160.57`, `md_render_ms` `181.8` -> `90.57` avg, `png_render_ms` `660.6` -> `126.87` avg).
- Commit hash(es): none

### 2026-02-16 10:50:22 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Detected active tail marker at session start (`[AGENTS-LOG-TAIL] ACTIVE_SESSION_UNTIL_CLEAN_CLOSE`), treated prior run as unclean exit, and resumed from current working tree per user direction (restart Option 1 behavior).
- Troubleshooting suggestions: If repository state appears inconsistent before next packet, run `git status` and `git log --oneline -n 5` first, then continue from the current `STATUS.md` map item.
- Resolutions/outcomes: Recovery condition acknowledged and documented; active session continued without workspace reset.
- Commit hash(es): none

### 2026-02-16 10:50:22 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Rolled pipeline map back to core behavior by removing map test-effect UI from `index.html`, removing load/test effect CSS from `css/main.css`, and removing animation/test-control runtime code from `js/main.js` while preserving MD parsing, independent MD/legacy toggles, and `# overrides` handling.
- Troubleshooting suggestions: If any map regression appears, check `initPipelineMap` for selectors (`data-map-controls=\"md\"`, `data-map-controls=\"legacy\"`) and verify `assets/world-map.md` keeps valid `# toggles`/`# overrides` pipe rows.
- Resolutions/outcomes: Map behavior now matches baseline scope (MD load + toggle controls + single-point overrides) with no animation test controls; Playwright smoke check passed for section presence, map render, toggle interactions, `900px`/`600px` responsive classes, and console errors.
- Commit hash(es): none

### 2026-02-16 12:23:40 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Created scoped map checkpoint commit with map-only files (`assets/world-map.md`, `css/main.css`, `js/main.js`) to capture baseline MD-driven behavior with independent toggles and override support.
- Troubleshooting suggestions: If legacy toggle controls fail on older markup, verify `bindLegacyToggleControls` fallback path to sibling controls remains intact in `js/main.js`.
- Resolutions/outcomes: Basic functional map state is now committed and available as rollback point.
- Commit hash(es): `0b479f3`

### 2026-02-16 14:04:44 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated map override parser in `js/main.js` so `value` is optional (supports `x|y|color|blink`, `x|y||blink`, and `x|y|blink` alongside legacy `x|y|value|color|blink`), adjusted dot styling logic to preserve default built color when color is omitted, broadened blink CSS selectors in `css/main.css`, and refreshed `assets/world-map.md` helper text/examples.
- Troubleshooting suggestions: If an override line appears ignored, check payload shape first (`x|y|...`) and confirm it has either a valid value token (`0`/`1`) or a style token (color and/or `rapid|slow|fade`).
- Resolutions/outcomes: Style-only overrides now work without terrain mutation; blink-only overrides keep base land/water color; yellow rapid test point (`37|21|yellow|rapid`) verified rendering as expected.
- Commit hash(es): none

### 2026-02-16 14:11:38 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added `random` as an accepted override blink token in `js/main.js` (`resolveOverrideBlink` + shorthand parsing), implemented runtime resolution from `random` to one of `rapid`/`slow`/`fade` per override dot during render, and updated `assets/world-map.md` helper text to document `random`.
- Troubleshooting suggestions: `random` is supported for `# overrides` only; for deterministic QA snapshots, use explicit `rapid`, `slow`, or `fade`.
- Resolutions/outcomes: Override lines such as `x|y|color|random` now parse and render with a valid blink class; verification confirmed a random override resolved to a concrete blink mode and rendered expected color.
- Commit hash(es): none

### 2026-02-16 14:34:02 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added optional override phase token parsing in `js/main.js` (`sync|async`, default `sync`), wired async per-dot negative animation delays for blink classes, updated blink CSS in `css/main.css` to respect per-dot delay variable, and updated `assets/world-map.md` helper text to document phase usage.
- Troubleshooting suggestions: Keep phase token as the last override field when used (`...|blink|phase`); omit phase to keep synchronized blinking by default.
- Resolutions/outcomes: Overrides can now share the same blink style while being explicitly in sync or out of sync; browser verification confirmed default sync has no delay and explicit async applies per-dot phase offset.
- Commit hash(es): none

### 2026-02-16 14:38:13 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added override coordinate-set variable support in `js/main.js` for `# overrides` (`$set_name=x1,y1;...` definitions and `@set_name|...` payload application), including case-insensitive set names and deduplicated coordinate entries; updated `assets/world-map.md` helper text with set syntax/examples.
- Troubleshooting suggestions: Define each set before first use in file order; set usage lines still require a valid payload (`value` and/or style tokens) after the set name.
- Resolutions/outcomes: A contained coordinate list can now be declared once and styled in one line, keeping large same-style clusters manageable without repeating per-point rows.
- Commit hash(es): none

### 2026-02-16 14:47:59 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Extended `js/main.js` override-set parser to accept block definitions (`$set_name={ ... }`) with coordinate lines in `x|y|` format, added equals-style set usage parsing (`@set_name=|...`) alongside existing pipe style, and updated `assets/world-map.md` helper text to document both forms.
- Troubleshooting suggestions: Keep block sets closed with `}` before using `@set_name...`, and ensure each coordinate line is `x|y|` (or inline `x,y` for semicolon form) with no extra non-empty fields.
- Resolutions/outcomes: User format is now accepted while preserving backward compatibility with existing `$set_name=x,y;...` and `@set_name|...` syntax.
- Commit hash(es): none

### 2026-02-16 15:09:18 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented color-transition fade behavior for map overrides by updating `js/main.js` dot class assignment (`map-dot--blink-fade-color`) and adding `mapDotPulseFadeColor` keyframes in `css/main.css`; updated `assets/world-map.md` helper text to clarify fade + color semantics.
- Troubleshooting suggestions: To get base-to-color fade, use a style override with both color and `fade` (for example `x|y|yellow|fade`); `rapid`/`slow` continue using opacity pulses with constant color.
- Resolutions/outcomes: Override dots can now animate from default terrain color to a target color and back when `blink=fade` is used with a color token.
- Commit hash(es): none

### 2026-02-16 15:16:47 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Restored original `fade` behavior for overrides and moved color-transition effect to new `glow` blink mode by updating blink token parsing in `js/main.js`, renaming dot animation class/keyframes in `css/main.css`, and revising override helper text in `assets/world-map.md`.
- Troubleshooting suggestions: Use `...|fade` for standard pulse and `...|color|glow` for base-to-target color transitions; `glow` without a color falls back to standard fade pulse.
- Resolutions/outcomes: Existing `fade` visuals are back to prior output, and the new transition effect is now opt-in via `glow`.
- Commit hash(es): none

### 2026-02-16 15:17:26 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Kept `random` blink behavior stable by leaving its selection pool at `rapid|slow|fade` only in `js/main.js`, and clarified this in `assets/world-map.md`.
- Troubleshooting suggestions: Use explicit `glow` when transition behavior is desired; `random` intentionally avoids `glow` for predictable legacy-style randomness.
- Resolutions/outcomes: `random` no longer changes behavior due the new mode addition, while `glow` remains available as explicit opt-in.
- Commit hash(es): none

### 2026-02-16 15:22:36 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Extended override payload parsing in `js/main.js` to support optional `color2` (`color1|color2|blink|phase`) while preserving existing shapes, updated dot render behavior so `glow` can animate `color1 -> color2 -> color1` (or base->color for single-color glow), and updated `css/main.css` keyframes plus `assets/world-map.md` helper syntax/examples accordingly.
- Troubleshooting suggestions: For explicit two-color transitions, use `...|color1|color2|glow` (plus optional `|sync|async`); `fade` remains opacity pulse and does not do color interpolation.
- Resolutions/outcomes: Overrides now support direct two-color control, addressing cases where default base color did not match desired start color.
- Commit hash(es): none

### 2026-02-16 15:23:54 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Corrected single-color `glow` transition logic in `js/main.js` so one-color glow now animates `base -> color1 -> base` while two-color glow stays `color1 -> color2 -> color1`.
- Troubleshooting suggestions: If a one-color glow appears static, verify the blink token is exactly `glow` and not `fade`.
- Resolutions/outcomes: One-color and two-color glow paths now behave as documented.
- Commit hash(es): none

### 2026-02-16 15:43:37 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Adjusted `mapDotPulseGlow` keyframes in `css/main.css` to increase start/end opacity and low-intensity glow so `color1` remains visible at phase boundaries.
- Troubleshooting suggestions: If you want stronger contrast between color phases, keep this brighter floor and vary `color1`/`color2` hue distance rather than reducing baseline opacity.
- Resolutions/outcomes: `glow` no longer starts from a near-dark `color1`; phase entry/exit are visibly brighter.
- Commit hash(es): none

### 2026-02-16 15:48:12 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reverted `mapDotPulseGlow` in `css/main.css` back to prior behavior and added a new `blend` blink mode (`js/main.js` parser + render mapping, `css/main.css` class/keyframes, `assets/world-map.md` docs) for full-opacity color1<->color2 transitions.
- Troubleshooting suggestions: Use `...|color1|color2|blend` when you want stable brightness across the cycle; keep `glow` for dim-floor pulse aesthetics.
- Resolutions/outcomes: Existing `glow` behavior is restored, and a separate mode now matches the requested color-to-color transition behavior.
- Commit hash(es): none

### 2026-02-16 16:01:43 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added bare-hex normalization in `js/main.js` override color parsing so tokens like `6b7385` are automatically converted to `#6b7385`; updated `assets/world-map.md` helper note accordingly.
- Troubleshooting suggestions: Hex colors can now be entered with or without `#`, but named CSS colors still require valid CSS keywords.
- Resolutions/outcomes: Missing `#` no longer causes override colors to fall back to black in the rendered SVG.
- Commit hash(es): none

### 2026-02-16 18:45:19 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Created requested checkpoint commit for current dark-theme map behavior using map-only files (`assets/world-map.md`, `css/main.css`, `js/main.js`).
- Troubleshooting suggestions: If rollback is needed before light/dark compatibility changes, reset only map files to this checkpoint commit.
- Resolutions/outcomes: Checkpoint commit created successfully.
- Commit hash(es): `56abae9`

### 2026-02-16 18:45:19 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added theme-specific Texas override color variables in `css/main.css` (`--map-texas-color-1`, `--map-texas-color-2` for dark/light) and updated `assets/world-map.md` Texas override to use `var(--map-texas-color-1/2)` with `blend`.
- Troubleshooting suggestions: Keep Texas override on CSS vars if you want instant palette tuning per theme; adjust only token values in `css/main.css`.
- Resolutions/outcomes: Texas persistent override now auto-adapts to active theme without changing override syntax per mode.
- Commit hash(es): none

### 2026-02-17 01:47:04 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed Pipeline Option 5 ring markup from `index.html`, relabeled map block header to `Map`, and removed unused ring-diagram styles from `css/main.css`.
- Troubleshooting suggestions: If you later want to reintroduce a non-map visual in Pipeline, keep it in a separate block to avoid coupling with map controls/render paths.
- Resolutions/outcomes: Pipeline section is now map-first with Option 5 removed, reducing visual and CSS surface area.
- Commit hash(es): none

### 2026-02-17 22:49:11 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated MD toggle marker coordinate handling in `js/main.js` to center integer `x|y` coordinates on map cells (`+0.5`), and added matching helper note in `assets/world-map.md`.
- Troubleshooting suggestions: Use integer coordinates for cell-centered markers; use decimal coordinates only when intentional sub-cell placement is desired.
- Resolutions/outcomes: Toggle markers now center on designated points instead of appearing offset toward upper-left.
- Commit hash(es): none

### 2026-02-18 00:36:33 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Disabled concurrent legacy PNG map generation/display by marking the legacy SVG block `data-map-disabled=\"true\"` and `hidden` in `index.html`, and filtered disabled maps out of `initPipelineMap` render/setup loops in `js/main.js` while keeping MD fallback-to-PNG logic.
- Troubleshooting suggestions: To re-enable legacy PNG quickly, remove `hidden` and `data-map-disabled=\"true\"` from the legacy block; JS paths are still present.
- Resolutions/outcomes: Pipeline now renders only the MD map path by default, with fallback behavior preserved and no legacy concurrent generation overhead.
- Commit hash(es): none

### 2026-02-18 00:47:48 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Replaced hard-coded map base colors and active-tab dark background with theme-aware CSS tokens in `css/main.css` (`--map-ocean-fill`, `--map-dot-water`, `--map-dot-land`, `--tab-active-bg`) and updated `js/main.js` glow base-fill fallback to use map color variables.
- Troubleshooting suggestions: Fine-tune light-theme map readability by adjusting only the new map tokens under `[data-theme=\"light\"]`; no parser/runtime changes needed.
- Resolutions/outcomes: Theme toggling now updates map base colors and active tab background in both dark and light modes.
- Commit hash(es): none

### 2026-02-18 08:48:37 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reduced `.pipeline-map-frame` border thickness and softened the stroke in `css/main.css`, then set `[data-theme=\"light\"] .pipeline-map-frame` border color to `var(--page-bg)` for minimal light-mode frame visibility.
- Troubleshooting suggestions: If the border still feels visible in light mode, set border width to `0` specifically in the light-theme override.
- Resolutions/outcomes: Map frame now appears thinner overall and blends with the page in light theme.
- Commit hash(es): none

### 2026-02-18 08:51:23 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated `[data-theme=\"light\"] .pipeline-map-frame` in `css/main.css` to `border: 0` and `background: var(--page-bg)` to eliminate remaining visible light-theme frame contrast.
- Troubleshooting suggestions: If any edge still appears, verify browser cache is cleared and that the active map frame isn’t inheriting custom local styles.
- Resolutions/outcomes: Light-mode map frame should now render flat with no medium-gray border.
- Commit hash(es): none

### 2026-02-18 08:53:29 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Tuned light-theme map colors in `css/main.css` to reduce washed-out brightness by darkening `--map-ocean-fill`, `--map-dot-water`, and `--map-dot-land`, and shifted light-mode map frame background to a soft slate tint (`#e7edf5`).
- Troubleshooting suggestions: If the map still feels bright, next adjustment should darken `--map-ocean-fill` one more step before changing dot colors again.
- Resolutions/outcomes: Light-theme map should render with stronger contrast and less glare while preserving existing override/toggle behavior.
- Commit hash(es): none

### 2026-02-18 08:55:48 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Re-tuned light-theme map tokens in `css/main.css` to follow dark-theme tonal logic more closely (`--map-ocean-fill: #233247`, `--map-dot-water: #3a4a61`, `--map-dot-land: #7f8ea3`).
- Troubleshooting suggestions: If you want even closer parity to dark mode, keep relative ordering and shift all three values one additional step darker together.
- Resolutions/outcomes: Light-theme map now keeps the same basic dark-theme color logic while remaining a distinct theme variant.
- Commit hash(es): none

### 2026-02-18 08:58:08 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added map-scoped accent token support by introducing `--map-accent` in `css/main.css`, setting a brighter light-theme value (`#2f66ff`), and wiring map controls/overlay markers plus JS `accent` token resolution in `js/main.js` to `var(--map-accent)`.
- Troubleshooting suggestions: If you want even stronger contrast in light mode, raise saturation of `--map-accent` before adjusting map base tones.
- Resolutions/outcomes: Map accent now stands out in light theme without changing the broader site accent system.
- Commit hash(es): none

### 2026-02-18 09:02:32 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Completed clean-exit package for map work: staged map-scope files only, added reminder in `STATUS.md` to review override colors in both themes, and created commit `59592a6`.
- Troubleshooting suggestions: Keep map changes isolated to `index.html`, `css/main.css`, `js/main.js`, and `assets/world-map.md` to avoid mixing with unrelated legal/docs edits currently in working tree.
- Resolutions/outcomes: Repository now has a dedicated checkpoint for the requested map/theme adjustments and is ready for push.
- Commit hash(es): `59592a6`

### 2026-02-18 09:30:14 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Per user-requested exit, ran final repository checks (`git status`, `git log --oneline -n 3`) and confirmed latest pushed map/session commits remain `e111bd1`, `59592a6`, `56abae9`.
- Troubleshooting suggestions: Before any next packet, clear or isolate pre-existing non-map working-tree changes to avoid accidental scope mixing.
- Resolutions/outcomes: Session closed with no additional code changes or commits after the pushed clean-exit package.
- Commit hash(es): `e111bd1`, `59592a6`, `56abae9`

### 2026-02-18 22:34:55 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Started new active packet in Packet B scope for map behavior update; reviewed current map toggle/render paths in `js/main.js`, map styling in `css/main.css`, and toggle authoring notes in `assets/world-map.md`.
- Troubleshooting suggestions: Keep map edits isolated to Packet B files to avoid collisions with current legal/docs working-tree changes.
- Resolutions/outcomes: Located toggle-point blink hook (`applyMdToggleData`) and matching marker-blink CSS as the exact removal target.
- Commit hash(es): none

### 2026-02-18 22:34:55 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed toggle marker blink class assignment/rendering in `js/main.js`, removed marker blink animation rules/keyframes in `css/main.css`, added smoother overlay switching behavior (`visibility`/`pointer-events` gating + faster opacity transition), and updated toggle docs in `assets/world-map.md` to mark trailing blink column as accepted-but-ignored.
- Troubleshooting suggestions: If additional smoothness is needed after this baseline, reduce active overlay marker count per toggle group and hide text labels under `900px` earlier to cut SVG text paint cost.
- Resolutions/outcomes: Toggle points no longer blink, overlay state changes are lighter-weight, and docs now match runtime behavior.
- Commit hash(es): none

### 2026-02-18 22:42:04 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added theme-specific category defaults for toggle marker colors in `css/main.css` (`--map-toggle-initial-evaluation`, `--map-toggle-structured-intake`, `--map-toggle-technical-review`, `--map-toggle-reference-model`), updated `js/main.js` so toggle `accent` resolves to `var(--map-toggle-{slug}, var(--map-accent))`, and documented category token behavior in `assets/world-map.md`.
- Troubleshooting suggestions: Keep category labels stable in the MD toggle column if you rely on auto-color defaults; custom color values in the row still override defaults.
- Resolutions/outcomes: Toggle categories now render with distinct defaults in dark/light themes without requiring per-row color edits.
- Commit hash(es): none

### 2026-02-18 22:45:36 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed visible MD/legacy map control blocks from `index.html`, retired legacy/MD map control handlers from `js/main.js` (including dynamic control-button creation and click toggling), and simplified overlay rendering/CSS so MD-authored category markers display together without below-map toggle controls.
- Troubleshooting suggestions: If per-category visibility control is needed later, reintroduce controls as a separate packet using a non-overlay state model (for example, filter classes) to avoid reviving legacy PNG assumptions.
- Resolutions/outcomes: Pipeline map no longer renders toggle buttons under the map, and current marker/category color logic remains intact.
- Commit hash(es): none

### 2026-02-18 22:49:34 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Restored MD-only map category toggle controls in `index.html` and `js/main.js`, kept legacy toggle controls retired, re-enabled overlay show/hide state classes, and styled toggle buttons in `css/main.css` to use each category marker color (`--map-control-color`) for active border/text/background parity.
- Troubleshooting suggestions: Keep toggle category labels stable in MD rows to preserve predictable button order and category color-token mapping.
- Resolutions/outcomes: Toggle buttons are back for current MD logic, old legacy control surface remains removed, and button colors now match visible category points.
- Commit hash(es): none

### 2026-02-18 22:54:14 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented Phase 1 map polish in `css/main.css`: added a subtle frame sheen pseudo-element animation (`mapFrameSheen`) using transform-only motion, set layering/isolation on `.pipeline-map-frame`, and added `prefers-reduced-motion` fallbacks that disable sheen and map control/overlay transitions.
- Troubleshooting suggestions: Keep sheen transform-only (no blur/filter animation) to retain low GPU overhead; if users report distraction, increase loop duration before lowering opacity.
- Resolutions/outcomes: Map now has a premium ambient sweep effect with accessibility-safe reduced-motion behavior and minimal performance risk.
- Commit hash(es): none

### 2026-02-18 23:14:02 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented Phase 2 map polish in `css/main.css`: added active toggle-button pulse ring (`mapControlPulse`), added marker shape micro-lift on hover plus label translate/opacity easing under hover-capable pointers, and extended reduced-motion overrides to disable new animation/transition paths.
- Troubleshooting suggestions: If pulse feels too busy, increase `mapControlPulse` duration first; if hover motion feels sharp, reduce marker scale from `1.08` to `1.05`.
- Resolutions/outcomes: Controls and markers now feel more responsive/premium without pointer-tracking or heavy runtime logic.
- Commit hash(es): none

### 2026-02-18 23:19:52 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented one-layer pointer-reactive map highlight: added `.pipeline-map-frame::after` spotlight layer in `css/main.css` and added RAF-throttled pointer handlers in `js/main.js` that update only two CSS variables (`--map-pointer-x`, `--map-pointer-y`) on fine-pointer/non-reduced-motion devices.
- Troubleshooting suggestions: If GPU use appears elevated on some systems, first lower spotlight size/opacity before reducing event sampling cadence.
- Resolutions/outcomes: Pointer-linked polish now runs as a single transformed layer with constrained runtime cost and no per-dot updates.
- Commit hash(es): none

### 2026-02-18 23:27:31 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Converted the pointer spotlight visual from white glow to blend-mode inversion reveal by updating `.pipeline-map-frame::after` in `css/main.css` to use stronger white radial values with `mix-blend-mode: difference` and adjusted theme-specific active opacity.
- Troubleshooting suggestions: If inversion appears too strong in certain map regions, reduce `.pipeline-map-frame.has-pointer-glow::after` opacity before changing blend mode.
- Resolutions/outcomes: Pointer layer now reveals opposite-tone map detail in-place (aligned with existing map content) while keeping the single-layer performance profile.
- Commit hash(es): none

### 2026-02-18 23:30:49 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reduced pointer reveal footprint by changing `.pipeline-map-frame::after` size to CSS variable (`--map-pointer-size`) and computing that value in `js/main.js` from map grid pitch (`viewBox width` to rendered width), targeting about 7 dot cells across with clamps for responsive stability.
- Troubleshooting suggestions: If you want it tighter or broader, adjust the multiplier (`dotStepPx * 7`) in `applyMapSizeClass` before changing clamp bounds.
- Resolutions/outcomes: Pointer inversion now behaves like a focused local reveal (roughly 6-8 dots in diameter) instead of a broad spotlight.
- Commit hash(es): none

### 2026-02-18 23:42:54 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added temporary blend-layer inspection controls in map UI by extending `applyMdToggleData` (`js/main.js`) with two debug buttons (`Full Layer 100%`, `Full Layer 50%`) and frame debug classes; added corresponding CSS preview states (`map-layer-preview-full-100/50`) in `css/main.css` that force `::after` to full-frame coverage at fixed opacity.
- Troubleshooting suggestions: If preview switches are no longer needed after tuning, remove `map-control--layer-preview` button creation and the two frame preview class rules together in one cleanup packet.
- Resolutions/outcomes: You can now inspect the full compositing layer directly at 100% and 50% opacity from the same control row used by category toggles.
- Commit hash(es): none

### 2026-02-18 23:47:41 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated pointer spotlight edge profile in `css/main.css` to hard-mask behavior (`radial-gradient` solid interior with `calc(100% - 0.5px)` cutoff), and set active spotlight opacity to full in both dark/light theme states.
- Troubleshooting suggestions: If the edge appears too alias-sharp on some displays, increase the falloff from `0.5px` to `1px` before lowering spotlight opacity.
- Resolutions/outcomes: Pointer reveal now reads as a crisp circular inversion mask rather than a soft spotlight gradient.
- Commit hash(es): none

### 2026-02-18 23:52:09 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Expanded temporary layer-preview buttons in `js/main.js` from two levels to five (`Full Layer 100/90/80/70/60%`), switched preview classing to a single `map-layer-preview-active` mode with `--map-layer-preview-opacity`, and updated CSS preview rules accordingly; also added pointer persistence by changing pointer update loop to eased RAF interpolation and adding ~160ms leave linger before removing `has-pointer-glow`.
- Troubleshooting suggestions: If pointer lag feels too sticky, reduce interpolation factor (`0.24`) or shorten leave linger timeout (`160ms`) in `initPipelineMap`.
- Resolutions/outcomes: Preview control granularity is higher for blend tuning, and pointer reveal now persists briefly after movement/exit rather than snapping off immediately.
- Commit hash(es): none

### 2026-02-18 23:57:10 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added a temporary live tuning strip in map controls (`js/main.js` + `css/main.css`) with text inputs for pointer glow parameters (`Size Dots`, `Falloff Px`, `Opacity`, `Ease`, `Linger Ms`), wired to update frame datasets/CSS vars in real time and immediately re-apply map sizing where required.
- Troubleshooting suggestions: Keep temporary tuning UI in-sync with pointer runtime defaults by updating `mapGlowTuningDefaults` first when changing initial behavior.
- Resolutions/outcomes: You can now tune core pointer glow values directly in-browser without code edits or reload-only iteration.
- Commit hash(es): none

### 2026-02-19 00:00:32 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Expanded full-layer preview buttons to complete 10% steps (`100` to `10`) in `js/main.js`, and added `Reset Defaults` button in the tuning strip that restores all pointer glow runtime defaults (`dot size`, `falloff`, `opacity`, `easing`, `linger`) and refreshes computed pointer size.
- Troubleshooting suggestions: If tuning presets become permanent, convert `mapGlowTuningDefaults` and the reset handler to a shared config object before removing debug UI.
- Resolutions/outcomes: You now have finer preview granularity plus one-click return to baseline values during live tuning.
- Commit hash(es): none

### 2026-02-19 00:09:39 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reworked pointer runtime in `js/main.js` from eased-head tracking to snap-to-cursor head plus a decaying `map-pointer-trail` ghost layer, keeping RAF throttling and existing linger tuning; relabeled tuning input `Ease` to `Trail Ease`; updated modifier helper text to explain each textbox in plain language; added trail-layer styling in `css/main.css` and hid trail during full-layer preview mode.
- Troubleshooting suggestions: If the trail feels too smeared, lower `Linger Ms` first; if it feels too tight, lower `Trail Ease` before increasing dot size.
- Resolutions/outcomes: Pointer persistence now reads as motion trail instead of cursor lag, and the tuning strip includes clearer on-page guidance for modifier purpose.
- Commit hash(es): none

### 2026-02-19 00:16:42 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Replaced the ghost-chase trail implementation in `js/main.js` with pooled stamp prints (`.map-pointer-print`) emitted on pointer movement, with per-print fade animation duration derived from `Linger Ms` and print cadence/density derived from `Trail Ease`; updated `css/main.css` to use `.map-pointer-trail-layer` and hide it in full-layer preview mode.
- Troubleshooting suggestions: If prints are still too dense, lower `Trail Ease`; if they vanish too fast, increase `Linger Ms` in small steps (for example +80ms).
- Resolutions/outcomes: Cursor now leaves distinct fading footprints that read as a trail, without the laggy “chasing orb” look.
- Commit hash(es): none

### 2026-02-19 00:52:24 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added a separate `Hover Flash` mode in `js/main.js` with a new map control button; implemented per-dot hover pulses (center + neighboring cells) that invert and fade back using WAAPI on pointer move; added dot-grid lookup caching for efficient hit targeting; enforced mutual exclusion so trail/head pointer layers are suppressed while flash mode is active; updated map tuning helper copy and added CSS mode/fallback rules in `css/main.css`.
- Troubleshooting suggestions: If flash appears too strong, reduce `startInvert`/`startBrightness` in `flashDot`; if it feels sparse, lower the movement/time gate in `emitHoverFlash`.
- Resolutions/outcomes: You can now switch between the existing trail behavior and a smoother live dot-invert hover animation without running both concurrently.
- Commit hash(es): none

### 2026-02-19 01:06:23 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Retuned trail mode in `js/main.js` to feel like a soft ghost trail by increasing pooled trail prints, increasing overlap density (shorter interval and distance gates), extending fade duration, and lowering per-print opacity; updated trail animation scaling/easing for gentler decay; softened `.map-pointer-print` style in `css/main.css` with a diffuse radial profile and slight blur; updated helper text to reflect ghost-trail semantics.
- Troubleshooting suggestions: If ghosting still feels heavy, lower `Linger Ms` first; if it feels too thin, raise `Opacity` before increasing `Trail Ease`.
- Resolutions/outcomes: Trail mode now leaves a smoother, softer afterimage instead of sharp print marks.
- Commit hash(es): none

### 2026-02-19 01:10:39 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Split pointer tuning UI into mode-scoped groups in `js/main.js` so trail controls and flash controls are shown only when their mode is active; added live `Hover Flash` tuners (`Flash Size`, `Fade Ms`, `Intensity`, `Grid Step`, `Delay Ms`) with dataset-backed defaults and clamped input handlers; added mode-specific reset behavior (`Reset Trail Defaults` / `Reset Flash Defaults`); parameterized flash runtime to use these values for radius, duration, strength, movement step threshold, and throttle interval; added `.map-tuning-group`/hidden state styles in `css/main.css`.
- Troubleshooting suggestions: If flash feels noisy, increase `Grid Step` and `Delay Ms`; if it feels weak, increase `Intensity` before increasing `Flash Size`.
- Resolutions/outcomes: You can now tune the active mode directly without seeing irrelevant controls from the other mode, and flash behavior has dedicated real-time knobs.
- Commit hash(es): none

### 2026-02-19 02:32:42 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed manual `Hover Flash` textbox controls from `js/main.js` and replaced them with curated preset buttons (`Flash Compact`, `Flash Balanced`, `Flash Wide`, `Flash Lingering`); bound runtime flash radius/duration/intensity/grid timing/throttle to selected preset values; kept size variants constrained to baseline with one-step smaller/larger options; updated tuning help copy; updated `STATUS.md` active-focus priority order for delivery target Friday, February 20, 2026 (map/pipeline first, then remaining readiness items).
- Troubleshooting suggestions: If presets still feel too strong, reduce `intensity` in the `wide` preset first; if they feel too subtle, increase `durationMs` in `balanced` before changing radius.
- Resolutions/outcomes: Flash mode is now preset-driven (no manual clutter), and planning is explicitly sequenced for tomorrow EOD completion with map/pipeline as first priority.
- Commit hash(es): none

### 2026-02-19 02:36:20 -06:00 | Agent: Codex | Version: GPT-5 | Session Clean Close
- Actions taken: Finalized map pointer-mode tuning changes by replacing manual hover-flash controls with preset buttons, reevaluated/updated roadmap priority in `STATUS.md` for a February 20, 2026 EOD target (pipeline/map first), ran final syntax verification (`node --check js/main.js`), and prepared clean-exit checkpoint commit for in-scope files.
- Troubleshooting suggestions: Start the next session on pipeline/map final QA using the updated Priority 1 block in `STATUS.md`, then proceed through remaining `0.6` checks in order.
- Resolutions/outcomes: Session closed with map interaction controls simplified (preset-driven flash mode) and roadmap sequencing explicitly aligned to next-day completion goals.
- Commit hash(es): recorded in clean-exit handoff summary.

### 2026-02-19 11:57:22 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reviewed current hover-flash runtime in `js/main.js`, confirmed compact preset still flashed center + cardinal neighbors, changed `Flash Compact` preset radius from `1.0` to `0.5` for single-dot center-only behavior, and updated flash help copy to match the new behavior.
- Troubleshooting suggestions: If you also want to remove the center-dot fade (not just neighbors), shorten `compact.durationMs` or adjust `flashDot` keyframes to a harder snap-off.
- Resolutions/outcomes: Compact flash now targets a single dot only, eliminating the plus-shape neighbor effect while keeping current fade-back animation.
- Commit hash(es): none

### 2026-02-19 12:00:59 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Hardened `Flash Compact` behavior in `js/main.js` by adding preset flag `centerOnly`, persisting it via frame dataset, and enforcing center-only flash emission path that clears any active flash animations before flashing the current center cell.
- Troubleshooting suggestions: If stale behavior persists, hard-refresh the browser (Ctrl+F5) to load updated `js/main.js`; if needed, append a cache-bust query to script URL in `index.html`.
- Resolutions/outcomes: Compact now behaves as strict one-dot-at-a-time flash, preventing plus-pattern carryover from overlapping fade/jitter events.
- Commit hash(es): none

### 2026-02-19 12:05:32 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added combinable flash-duration tuning for map hover flash in `js/main.js`: introduced duration bounds (`80..2000ms`), added `Linger` test-button row (`190/260/340/460/620`) in flash mode controls, added `Lingering Ms` text input for manual duration override, and synchronized preset/reset handlers so duration controls work on top of any base preset including `Flash Compact`; added companion button styling in `css/main.css`.
- Troubleshooting suggestions: If linger feels too persistent with compact, lower `Lingering Ms` first before changing compact intensity; if control state appears stale, hard-refresh browser cache.
- Resolutions/outcomes: Flash controls now support compact single-dot shape with independently adjustable fade duration using both quick test buttons and manual text entry.
- Commit hash(es): none

### 2026-02-19 12:11:15 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented a rolling map-column glow sweep in `js/main.js` and `css/main.css` using a two-rect SVG overlay state machine (`lead` column + `fading` column) that advances left-to-right on interval and restarts cleanly per map re-render.
- Troubleshooting suggestions: If sweep speed feels too fast/slow, tune `mapColumnGlowDefaults.stepMs` in `js/main.js`; if contrast needs adjustment, tune `.map-column-glow--lead`/`--fade` fills in `css/main.css`.
- Resolutions/outcomes: Map now shows continuous left-to-right column glow progression with overlap/fade behavior while ensuring no more than two columns are in glow/fade state simultaneously.
- Commit hash(es): none

### 2026-02-19 12:14:34 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated flash-mode behavior in `js/main.js` so compact single-dot mode can keep lingering tail drag (`mapFlashCompactGlow`) instead of forcibly clearing prior flashes; added visible `Flash FX Tests` button category (`Glow Tail`, `Sliding Flash`) in map controls; wired `Sliding Flash` to runtime column-sweep enable/disable (`syncColumnGlowForMap`); added matching styles in `css/main.css`; and aligned flash help copy/reset behavior.
- Troubleshooting suggestions: If compact looks too busy, toggle `Glow Tail` off to restore strict one-dot/no-trail behavior; if ambient sweep is distracting, toggle `Sliding Flash` off.
- Resolutions/outcomes: You can now run `Flash Compact` with lingering tail behavior and explicitly test/toggle both glow-tail and sliding-flash visual modes from visible control buttons.
- Commit hash(es): none

### 2026-02-19 12:21:02 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Per user clarification, removed old frame-only vertical sheen animation from `css/main.css`, removed legacy `Sliding Flash` toggle wiring from `js/main.js`, and added direct glow-sweep test controls (`Max Opacity`, `Active Lines`, `Speed Ms`) under `Glow Tests`, with live runtime reapplication through `syncColumnGlowForMap`.
- Troubleshooting suggestions: If sweep feels too dense, reduce `Active Lines`; if it feels harsh, lower `Max Opacity`; if it looks jittery, raise `Speed Ms`.
- Resolutions/outcomes: Controls now target the map column-sweep effect itself (not frame sheen), and the unrelated vertical frame animation is removed.
- Commit hash(es): none

### 2026-02-19 12:25:20 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated hover flash in `js/main.js`/`css/main.css` to be color-aware per dot type via precomputed flash color variables (`--map-dot-hover-flash-from/mid/to`) with WAAPI + keyframe fallback support; updated linger test button values to `460/720/960/1440/2000` ms.
- Troubleshooting suggestions: If override dots feel too bright, reduce the override flash `color-mix` ratios in `createDot`; if motion feels too long, lower `Lingering Ms` or use the lower linger test buttons.
- Resolutions/outcomes: Hover flash now responds to underlying map color classes without per-frame pixel sampling, and linger presets now cover longer ranges with cleaner interval spacing.
- Commit hash(es): none

### 2026-02-19 13:10:07 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added `Force Sweep On` toggle in `Glow Tests` (`js/main.js`) to explicitly bypass the `prefers-reduced-motion` gate for map column-sweep testing; wired visual state sync and reset-to-default behavior (`force off`) for the new toggle.
- Troubleshooting suggestions: Leave `Force Sweep On` off for normal accessibility behavior; enable it only while validating sweep visuals under reduced-motion environments.
- Resolutions/outcomes: You now have an explicit on-control to run the vertical map-line sweep even when reduced-motion is active in browser/OS settings.
- Commit hash(es): none

### 2026-02-19 13:17:29 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Investigated no-visible-effect report for `Force Sweep On`; found `.map-column-glow--line { opacity: 0; }` CSS rule suppressing runtime opacity updates; removed hard opacity from CSS and switched JS sweep updates to inline `style.opacity` assignments for deterministic visibility.
- Troubleshooting suggestions: If sweep is still subtle after fix, raise `Max Opacity`, increase `Active Lines`, and lower `Speed Ms`; then hard-refresh to clear stale CSS.
- Resolutions/outcomes: Force toggle now has visible impact because glow-line opacity is no longer pinned to zero by stylesheet precedence.
- Commit hash(es): none

### 2026-02-19 13:25:58 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated compact hover flash color logic in `js/main.js` so center-only (`Flash Compact`) flashes with the opposite terrain palette (land uses water flash palette; water uses land flash palette), added per-dot opposite palette variables during dot creation, and wired non-WAAPI fallback runtime variables; updated `mapDotHoverFlash` keyframes in `css/main.css` to consume runtime flash vars.
- Troubleshooting suggestions: If compact colors appear unchanged, hard-refresh (`Ctrl+F5`) to clear stale CSS/JS; if fallback browsers show residual color between flashes, reduce `Lingering Ms` and retest.
- Resolutions/outcomes: Compact cursor flash now visibly inverts land/water palette while non-compact flash behavior remains unchanged.
- Commit hash(es): none

### 2026-02-19 13:35:56 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed non-compact hover flash presets from `js/main.js` by making `mapFlashPresetDefaults` compact-only, removing preset-button render/sync wiring from flash controls, and updating helper copy to describe compact-only behavior while leaving `Lingering Ms`, linger test buttons, `Glow Tail`, and `Glow Tests` controls intact.
- Troubleshooting suggestions: If old preset buttons still appear, hard-refresh (`Ctrl+F5`) to load updated script bundle.
- Resolutions/outcomes: Flash controls now expose only compact behavior, with all compact adjustment controls preserved and no other map effects changed.
- Commit hash(es): none

### 2026-02-19 13:37:47 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated compact opposite flash palette in `js/main.js` to remove accent tinting and use exact opposite base terrain colors by setting `flashMidOpposite`/`flashToOpposite` to `var(--map-dot-water)` or `var(--map-dot-land)` based on the underlying dot type.
- Troubleshooting suggestions: If red/blue accent tones still appear, hard-refresh (`Ctrl+F5`) to clear stale JS cache.
- Resolutions/outcomes: Compact flash now swaps directly between land/water base colors without accent color injection.
- Commit hash(es): none

### 2026-02-19 13:42:07 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Disabled compact flash filter boost in `js/main.js` by adding `suppressFilter` option to `flashDot` and enabling it for compact center-only emission; extended runtime flash variable reset/set to include filter vars; updated `mapDotHoverFlash` keyframes in `css/main.css` to read runtime filter vars so fallback path also renders compact with no brightness/invert/saturation boost.
- Troubleshooting suggestions: If flashes still look bright, hard-refresh (`Ctrl+F5`) to ensure updated CSS/JS are loaded.
- Resolutions/outcomes: Compact flash now renders as pure opposite-color swap with no extra luminance lift.
- Commit hash(es): none

### 2026-02-19 13:50:22 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added a live glow cost meter in `js/main.js` flash controls (`Glow Tests`) that reports line updates/s, DOM writes/s, and relative load vs defaults; added supporting tier styles in `css/main.css`; fixed two unmatched parentheses in `mapDotHoverFlash` keyframe `fill` var-chains in `css/main.css`, restoring CSS parse integrity for downstream tab/layout rules.
- Troubleshooting suggestions: If tabs still appear as full-scroll/no borders, hard-refresh (`Ctrl+F5`) to load corrected CSS; verify no stale cached stylesheet is served.
- Resolutions/outcomes: Glow controls now expose live performance cost, and tab styling/section targeting rules are no longer impacted by keyframe syntax breakage.
- Commit hash(es): none

### 2026-02-19 14:51:59 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated column glow runtime in `js/main.js` to animate the lead sweep line top-to-bottom on each step (`revealLeadLine`) while keeping trailing columns as full-height fade lines; added `leadRafId` tracking and cancellation in `stopColumnGlow` to avoid stale animation frames during reset/restart.
- Troubleshooting suggestions: If reveal feels too fast/slow, tune `revealMs` clamp in `revealLeadLine` (`40..140ms`) relative to `Speed Ms`.
- Resolutions/outcomes: New sweep columns now populate from top to bottom quickly instead of appearing instantly at full height.
- Commit hash(es): none

### 2026-02-19 14:55:11 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added a dedicated `Load Ms` glow tuning input in `js/main.js` (`mapTuneGlowLoad`) and wired it to frame dataset (`mapGlowLoadMs`) defaults/reset (`mapColumnGlowDefaults.loadMs`), then switched lead-column transition timing to use `loadMs` directly in `revealLeadLine`; updated flash helper copy to include `Load Ms`.
- Troubleshooting suggestions: If reveal overlap feels too heavy, lower `Load Ms` or raise `Speed Ms`; if reveal is too abrupt, raise `Load Ms` in small steps.
- Resolutions/outcomes: Vertical top-to-bottom lead-line populate speed is now user-adjustable independently from sweep step speed.
- Commit hash(es): none

### 2026-02-19 15:00:02 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented first-load map reveal in `js/main.js` sweep runtime by applying SVG clip-path (`inset`) to the map and advancing it with the lead sweep column (`advanceInitialReveal`) until full width is revealed; persisted completion on frame dataset via `mapGlowInitialRevealDone` so reveal runs once per page load/session; added clip cleanup in `stopColumnGlow`.
- Troubleshooting suggestions: If reveal does not replay when expected, hard-refresh the page (new frame dataset state starts fresh on reload).
- Resolutions/outcomes: Initial map load now appears to be drawn by the sweep’s leading edge; subsequent sweeps keep normal behavior without re-hiding the map.
- Commit hash(es): none

### 2026-02-19 15:09:53 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added startup-first-sweep control path in `js/main.js` (`mapGlowStartupSpeedMs`) so initial reveal can run at a dedicated speed before reverting to normal `Speed Ms`; added a dedicated test dock near map title (`pipeline-map-tests`) and moved tuning UI there; made sweep/flash tuning visible without requiring `Hover Flash` mode; replaced single sweep-cost text with dynamic per-effect diagnostics (`Trail`, `Flash Compact`, `Sweep`, `Startup Sweep`) and wired live refresh hooks across input/toggle/reset handlers; added supporting styles in `css/main.css`.
- Troubleshooting suggestions: If you do not see the new dock/readouts near the map title, hard-refresh (`Ctrl+F5`) to clear cached JS/CSS.
- Resolutions/outcomes: You now have always-visible test fields and live effect-by-effect readouts, plus dedicated startup sweep timing control independent from ongoing sweep speed.
- Commit hash(es): none

### 2026-02-19 15:19:43 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reworked map test UI grouping in `js/main.js` to explicit labeled blocks (`Flash Tail Tests`, `Sweep Actions`, `Sweep Tests`, `Linger Tests`, `Effect Readout`); removed bottom-row debug controls (`Hover Flash` toggle and all `Full Layer %` buttons) by removing their render paths; forced pointer mode to flash in map controls init; replaced `Force Sweep On` with action button `Reset Sweep` that resets `mapGlowInitialRevealDone` and reruns first-load draw; removed trail-only tuning inputs from the dock; updated dynamic readout lines to `Glow Tail`, `Flash Compact`, `Sweep`, and `Startup Sweep`.
- Troubleshooting suggestions: If old buttons or old grouping still appear, hard-refresh (`Ctrl+F5`) to invalidate cached JS/CSS.
- Resolutions/outcomes: Test controls are now grouped under clear labels near the map title, readout sits at the bottom, and only map category buttons remain in the user category row.
- Commit hash(es): none

### 2026-02-19 15:25:01 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Expanded startup-only sweep control surface in `js/main.js` by adding startup-specific sweep datasets (`mapGlowStartupMaxOpacity`, `mapGlowStartupActiveLines`, `mapGlowStartupSpeedMs`, `mapGlowStartupLoadMs`) and corresponding UI row (`Startup Sweep Tests`) with the same four fields as runtime sweep; retained separate runtime row (`Sweep Tests`) with matching fields; updated sweep runtime phase config so startup values apply only during initial reveal and runtime values apply afterwards.
- Troubleshooting suggestions: Use `Reset Sweep` after changing startup settings to replay first-pass and verify startup-only effects; if values appear unchanged, hard-refresh (`Ctrl+F5`).
- Resolutions/outcomes: Startup and ongoing sweep behavior can now be tuned independently using identical field sets on consecutive rows.
- Commit hash(es): none

### 2026-02-19 15:31:24 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Moved `Linger Tests` controls in `js/main.js` to sit directly under `Flash Tail Tests`/`Glow Tail` so linger tuning is grouped with compact flash tail behavior; updated sweep runtime in `startColumnGlow` to precompute per-column land ratios and apply subtle terrain-weighted decay (`land` columns fade slightly slower, `ocean` columns fade slightly faster) while keeping existing startup/runtime sweep controls unchanged.
- Troubleshooting suggestions: If the terrain fade split feels too subtle or too strong, adjust the internal decay exponents (`landFadeExponent`/`oceanFadeExponent`) in `startColumnGlow`; use `Reset Sweep` to replay startup and compare before/after behavior.
- Resolutions/outcomes: Linger controls are now scoped under the Glow Tail section, and sweep trailing fade now differentiates by map terrain composition without adding new UI toggles.
- Commit hash(es): none

### 2026-02-19 15:38:27 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added new `Sweep Actions` toggle button (`Tail = Load`) in `js/main.js` that flips `frame.dataset.mapGlowTailLoadSync`; when enabled, trailing sweep lines use a new `revealTailLine` path with `Load Ms`-based transition timing and slight per-line vertical offsets so tails are not stacked at identical heights; wired default/reset handling (`false`) and readout status (`tail-load-sync on/off`), and added RAF cleanup for tail animations in `stopColumnGlow` and inactive-line branches.
- Troubleshooting suggestions: If the offset feels too strong or too subtle, tune `offsetY` multiplier (`lineIdx * 0.45`) in `revealTailLine`; use `Reset Sweep` after toggling for easy side-by-side startup comparison.
- Resolutions/outcomes: You can now force trailing fade/reveal timing to match `Load Ms` with a one-click toggle, while keeping trailing lines slightly vertically staggered as requested.
- Commit hash(es): none

### 2026-02-19 15:40:48 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Lowered sweep speed floor in `js/main.js` to allow faster-than-20ms updates by changing startup and runtime speed clamps from `20/60` to `8` across runtime application (`startColumnGlow`), sweep stats/readout math (`calcSweepStats`), and both tuning fields (`Startup Sweep Tests` and `Sweep Tests` input handlers).
- Troubleshooting suggestions: Browser frame pacing still limits perceived smoothness (sub-16ms intervals can bunch into single frames); use `Load Ms` and `Active Lines` tuning to shape perceived motion rather than relying on very low interval values alone.
- Resolutions/outcomes: Sweep controls now accept and run at values below `20ms` for both startup and ongoing behavior.
- Commit hash(es): none

### 2026-02-19 15:43:28 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Addressed vertical load pop-in by changing phase scheduling in `js/main.js` to use `stepMs = max(Speed Ms, Load Ms)` for both startup and runtime phases (`getPhaseConfig`), including timer handoff after initial reveal completion; updated sweep diagnostics to compute/report load using the same effective cadence and display `effective step` in readout.
- Troubleshooting suggestions: If you want faster horizontal travel while keeping high `Load Ms`, you will need lower `Load Ms` (or a deeper architectural change with additional line buffers) because current line reuse intentionally waits for reveal completion to avoid pop-in.
- Resolutions/outcomes: High `Load Ms` no longer causes mid-column vertical reveal truncation/pop as columns advance.
- Commit hash(es): none

### 2026-02-19 15:50:11 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated `Tail = Load` tail animation geometry in `js/main.js` by replacing vertical `y` offsets with top-anchored tails (`y=0` always), and applying slight bottom-only trim (`bottomTrimPx`) based on tail depth so middle/trailing lines still end at slightly different levels without blank pixels at the top.
- Troubleshooting suggestions: If the bottom stagger is still too subtle/strong, tune `bottomTrimPx` range (`0.2..1.1px`) in `revealTailLine`.
- Resolutions/outcomes: Leading, middle, and trailing lines now all reveal top-to-bottom with no top-row gaps; fade-stack differentiation remains via bottom-edge staggering.
- Commit hash(es): none

### 2026-02-19 15:59:01 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Applied requested baseline defaults in `js/main.js` (`mapColumnGlowDefaults` now startup `1/3/20/20`, runtime `0.1/3/1200/600`; compact flash linger default `80ms`), added new sweep head option `mapGlowLeadFull` with UI toggle button `Lead Full` under `Sweep Actions`, and reworked sweep tail behavior to feel like dissipating burn-in by always animating middle/trailing lines top-to-bottom plus a dedicated `dissipateRect` pass that fades the previous trailing column top-to-bottom instead of hard pop-out.
- Troubleshooting suggestions: If burn dissipation lingers too long/short, tune `dissipateMs` multiplier (`phase.loadMs * 1.12`) and/or `targetY` in `dissipateTrailingLine`; if tail reveal is too quick in non-sync mode, tune `tailRevealMs` cap (`phase.loadMs * 0.68`).
- Resolutions/outcomes: Sweep now keeps top coverage with no blank top pixels, middle/trailing lines animate top-to-bottom, prior trailing line gently dissipates rather than popping, and head-line full-opacity override is independently toggleable.
- Commit hash(es): none

### 2026-02-19 16:58:25 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed middle-column vertical reveal path in `js/main.js` by deleting `revealTailLine`/tail RAF reuse and switching non-lead lines to full-height columns with opacity-only fade transitions; kept lead top-to-bottom load and trailing dissipate pass intact, with `Tail = Load` now controlling fade/dissipation timing rather than middle-column vertical growth.
- Troubleshooting suggestions: If middle fade still feels too abrupt, increase non-sync `tailFadeMs` floor (`80ms`) or enable `Tail = Load` so fade timing follows `Load Ms`.
- Resolutions/outcomes: Middle columns no longer show scroll/load behavior; they remain fully lit columns that fade, while trailing burn dissipation still disappears top-to-bottom.
- Commit hash(es): none

### 2026-02-19 17:02:51 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added `Edge Line` sweep option in `js/main.js` by introducing dataset flag `mapGlowLeadEdgeLine`, adding a new `Sweep Actions` toggle button, and rendering a narrow dedicated edge rect (`width 0.1`) at the lead column front boundary (`x + 0.95`) with independent visibility; updated reset defaults and sweep readout line to include `edge-line on/off`.
- Troubleshooting suggestions: If the edge line looks too thick/thin, tune `edgeRect` width (`0.1`) and lead-edge x offset (`+0.95`) in `startColumnGlow`.
- Resolutions/outcomes: You can now enable a thin, solid front-edge line that rides the sweep head and occupies the pixel-gap region between map columns.
- Commit hash(es): none

### 2026-02-19 17:07:00 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added sweep master toggle in `js/main.js` (`mapGlowEnabled`) with new `Sweep On` button in `Sweep Actions`; when off, `startColumnGlow` now stops/removes sweep layer immediately, while retaining current sweep parameters for later re-enable; updated sweep readout text to reflect disabled state and wired reset defaults to restore `Sweep On`.
- Troubleshooting suggestions: If sweep appears stuck off after toggling, verify `Sweep On` button is active (pressed) and hard-refresh once to clear cached JS.
- Resolutions/outcomes: You can now turn sweep behavior off/on in test mode without changing any other map settings.
- Commit hash(es): none

### 2026-02-19 17:12:51 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Implemented startup `Sprinkle` reveal mode in `js/main.js` with deterministic seeded shuffle (`buildSprinkleOrder`) and batch-based reveal from blank map dots; added new startup datasets/defaults (`mapGlowStartupMode`, `mapGlowSprinkleMs`, `mapGlowSprinkleStepMs`, `mapGlowSprinkleSeed`), added `Startup Mode` controls (`Startup Sweep` / `Startup Sprinkle`) plus `Startup Sprinkle Tests` fields (`Sprinkle Ms`, `Step Ms`, `Seed`), and updated startup effect readout to report mode-specific metrics; wired reset/default/state sync and safe cleanup for in-progress sprinkle timers/restoration.
- Troubleshooting suggestions: If sprinkle feels too chunky, lower `Step Ms` and/or raise `Sprinkle Ms`; if reveal order should change, modify `Seed` (same seed keeps deterministic order).
- Resolutions/outcomes: You can now choose between sweep startup and sprinkle startup, and tune sprinkle timing/order live from test controls.
- Commit hash(es): none

### 2026-02-19 17:38:59 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated startup sprinkle defaults in `js/main.js` to match selected baseline (`durationMs: 1500`, `stepMs: 20`, `seed: 37`), switched startup mode default to `sprinkle` for first-run initialization, and updated reset-default behavior to restore `Startup Sprinkle` mode instead of `Startup Sweep`.
- Troubleshooting suggestions: If you still see `Startup Sweep` selected after this change, hard-refresh (`Ctrl+F5`) so cached JS is replaced.
- Resolutions/outcomes: New sessions and reset-default actions now land on the requested startup sprinkle profile from your screenshot.
- Commit hash(es): none

### 2026-02-19 17:44:08 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Changed sweep default state in `js/main.js` to off by default (`mapGlowEnabled='false'`) and aligned reset defaults to keep sweep off; implemented hidden test-panel visibility control using `maptests` query parameter + localStorage key (`tsi-map-tests-visible`) with runtime sync for `[data-map-tests]`; added private keyboard toggle (`Ctrl+Shift+M`) to reveal/hide test controls without exposing them to normal users.
- Troubleshooting suggestions: Use `?maptests=1` once to force visible test panel (or `Ctrl+Shift+M`), then refresh; if you want to force hide again, use `?maptests=0` or toggle off and refresh.
- Resolutions/outcomes: End users no longer see the map test dock by default, while you still retain on-demand access and persistent visibility control for testing sessions.
- Commit hash(es): none

### 2026-02-19 17:48:54 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Restricted the map-test hotkey guard in `js/main.js` by adding `isPortalModalOpen()` check (`#portalModal` visibility) before processing `Ctrl+Shift+M`, so the hidden test panel can only be toggled while the TSI Internal modal is open.
- Troubleshooting suggestions: If hotkey seems inactive, open `TSI INTERNAL ACCESS` modal first, then press `Ctrl+Shift+M`.
- Resolutions/outcomes: Keyboard reveal/hide for map test controls is now scoped to the internal-access modal context only.
- Commit hash(es): none

### 2026-02-19 17:54:20 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Fixed map test-panel visibility reliability by updating `syncMapTestsVisibility()` and panel creation path to set inline `display` (`grid`/`none`) in addition to `hidden`/`aria-hidden`; removed localStorage-backed persistence default so reload hides tests unless explicit `?maptests=1`; added on-screen toggle confirmation toast (`map-tests-toggle-toast`) shown after successful `Ctrl+Shift+M` toggles.
- Troubleshooting suggestions: If tests still appear immediately after refresh, verify URL doesn’t include `?maptests=1`; use `?maptests=0` to force-hide for that load.
- Resolutions/outcomes: Hotkey now gives visible confirmation and the test menu reliably hides on reload for normal users.
- Commit hash(es): none

### 2026-02-19 17:58:48 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Finalized site-global test-settings visibility behavior in `js/main.js` by removing URL query override path, restoring localStorage-backed persistence keyed to hotkey intent, extending visibility sync selector to `[data-map-tests], [data-test-settings]`, and adding MutationObserver sync for dynamically added test panels; also removed early return in `initPipelineMap` so global toggle wiring runs even on pages without active map SVGs.
- Troubleshooting suggestions: If test panels are unexpectedly visible site-wide, open `TSI INTERNAL ACCESS` modal and press `Ctrl+Shift+M` once to turn them off globally.
- Resolutions/outcomes: Test-panel exposure is now controlled only by the scoped hotkey method, while state applies consistently across pages/locations that include test settings.
- Commit hash(es): none

### 2026-02-19 18:11:19 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Completed map UX adjustments in `index.html`, `js/main.js`, `css/main.css`, and `assets/world-map.md`: removed the visible `MD Map (world-map.md)` label, added helper copy above the map frame, changed MD toggle defaults so all start off and the first category activates shortly after render, softened/slowed active toggle pulse animation, and added below-map category description cards that dim when off and light up with each toggle. Extended MD toggle parsing to support optional `Toggle Category|Category Description|Title|x|y|shape|color|size` rows while preserving legacy toggle formats.
- Troubleshooting suggestions: For category descriptions, keep at least one row per category with a non-empty `Category Description`; parser uses the first non-empty description found for that category. If the first category does not auto-light, verify no custom script toggles categories before the delayed activation window (~120ms).
- Resolutions/outcomes: Pipeline map now loads without the source-label artifact, category controls start with only the first category active post-load, click behavior helper text is present, and category meaning text is sourced from `world-map.md` and visually synced to toggle on/off state.
- Commit hash(es): none

### 2026-02-19 18:16:58 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated MD category control layout in `js/main.js` and `css/main.css` so each category renders as a fixed-size toggle button in the left column with its explanation in the right column (single control grid), producing the requested 2-column by 4-row structure for current four categories; removed separate below-map description host wiring and kept active/inactive sync directly in the grid rows.
- Troubleshooting suggestions: If text truncation occurs for longer explanations, shorten category description strings in `assets/world-map.md` or increase the second-column width by reducing the fixed toggle column width in `.pipeline-map-controls[data-map-controls=\"md\"]`.
- Resolutions/outcomes: Category toggles now stack vertically with equal button dimensions, and explanations appear to the right of each toggle with active-state lighting synced to each button.
- Commit hash(es): none

### 2026-02-19 18:22:22 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Tuned map category row visuals in `css/main.css` by reducing toggle/control heights, changing category explanation text to site-default body scale, and allowing description rows to auto-grow only when content wraps beyond one line; added one-shot frame flash animation (`map-frame-category-flash-active`) and color variable (`--map-frame-category-flash-color`) on `.pipeline-map-frame`. Wired activation-trigger logic in `js/main.js` so turning a category on flashes the frame briefly using that category color (non-persistent).
- Troubleshooting suggestions: If flash feels too strong/weak, adjust `@keyframes mapFrameCategoryFlash` opacity/shadow mixes or duration (`0.42s`) in `css/main.css`; if you want the initial auto-enabled category to skip flash, pass `{ flashFrame: false }` to the delayed first-category activation call.
- Resolutions/outcomes: Category control rows are more compact, explanation text matches general site sizing, rows keep button-height by default while supporting wrapped overflow growth, and each category activation now gives a short color-keyed frame flash.
- Commit hash(es): none

### 2026-02-19 18:27:29 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Softened category activation feedback by extending and lowering intensity of `mapFrameCategoryFlash` in `css/main.css` and aligning JS flash-class cleanup timing to new duration (`900ms`). Implemented collapsed-left inactive description behavior (`max-width` collapse + hidden text) that expands on active state in the controls grid. Fixed startup sprinkle regression in `js/main.js` by allowing one-time sprinkle startup to run even when sweep is disabled (`mapGlowEnabled=false`), with dedicated sprinkle-only runtime tracking/cleanup and `mapGlowInitialRevealDone` completion update.
- Troubleshooting suggestions: If collapsed descriptions feel too narrow, increase inactive `max-width` in `.map-category-description`; if startup sprinkle still doesn’t appear, confirm `Startup Mode` is `Startup Sprinkle` and `mapGlowInitialRevealDone` is reset via `Reset Sweep`.
- Resolutions/outcomes: Activation flash is gentler/slower, description boxes stay collapsed until toggled on, and sprinkle intro loads again with sweep off.
- Commit hash(es): none

### 2026-02-19 18:32:10 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Halved map frame inner spacing by changing `.pipeline-map-frame` padding from `16px` to `8px` (and mobile `12px` to `6px`) in `css/main.css`; added a dedicated in-frame gap flash layer (`.map-frame-gap-flash-layer`) injected from `js/main.js` and animated in sync with the existing outer frame flash class. Tuned collapsed description behavior to fully fold left (`max-width: 0`, zero horizontal padding when inactive) and expand only when active. Confirmed startup sprinkle code path remains available when sweep is disabled and retained syntax-valid `js/main.js`.
- Troubleshooting suggestions: If gap flash is too subtle/strong, adjust `@keyframes mapFrameCategoryGapFlash` border color mix percentage; if collapsed boxes should peek slightly while inactive, raise inactive `max-width` from `0` to a small value.
- Resolutions/outcomes: The blank gap is now half-sized, the gap itself flashes in sync with frame activation using a secondary/tinted category color, descriptions collapse hard-left until activated, and sprinkle startup remains functional with sweep off.
- Commit hash(es): none

### 2026-02-19 18:35:23 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated `css/main.css` map controls layout so category rows are fixed-height across breakpoints (`grid-auto-rows: 42/40/38px`) and both toggle button cells plus description cells use matching `height/min-height/max-height`; description text now uses one-line truncation (`white-space: nowrap`, `text-overflow: ellipsis`) to prevent vertical growth when expanded.
- Troubleshooting suggestions: If you need more readable text without layout movement, increase right-column width or reduce description copy length in `assets/world-map.md` rather than allowing wrapping.
- Resolutions/outcomes: Collapsed descriptions now animate only horizontally, row heights stay stable, and map position no longer shifts as toggles are used.
- Commit hash(es): none

### 2026-02-19 18:40:41 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Fixed remaining visual height mismatch in `css/main.css` by applying `box-sizing: border-box` to MD grid toggle buttons and description cells across desktop/tablet/mobile overrides, ensuring declared fixed heights include padding/border for both cell types.
- Troubleshooting suggestions: If any row still appears off by 1px, check browser zoom and font rendering; the CSS now hard-locks cell box heights at each breakpoint.
- Resolutions/outcomes: Toggle and description cells now render at matching heights row-by-row while retaining horizontal collapse behavior.
- Commit hash(es): none

### 2026-02-19 18:44:44 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Slowed map category description expansion in `css/main.css` by updating the transition timing for width/padding/color/background/opacity to `1.1s` with the same cubic-bezier curve already used by frame and gap flash animations.
- Troubleshooting suggestions: If this still feels too fast/slow, adjust the shared `1.1s` duration value in both description transition and frame/gap flash animation declarations together to keep synchronization.
- Resolutions/outcomes: Description panel expansion now animates more gently and matches frame color flash timing on toggle activation.
- Commit hash(es): none

### 2026-02-19 18:51:43 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Updated `js/main.js` first-default category activation flow to wait for startup population completion (`mapGlowInitialRevealDone`) when startup animation is actually running, preventing early auto-on during map populate. Added pipeline-only background header treatment in `css/main.css` (`#pipeline > .header-group` absolute/low-opacity layer with no layout footprint) so main map content starts without header spacing. Retimed toggle-controlled map markers (`.map-overlay`) to `1.1s` cubic-bezier fade in/out with delayed visibility hide for smooth transitions matching toggle/text/frame timing.
- Troubleshooting suggestions: If the first toggle appears late, verify startup mode and `mapGlowInitialRevealDone` state; if needed, use `Reset Sweep` to replay startup and confirm gating behavior. If background header is too subtle/strong, adjust `#pipeline > .header-group` opacity.
- Resolutions/outcomes: First auto-toggle now waits for map populate completion, pipeline header is present as a non-blocking background element, and map overlay marker fades are synchronized with the rest of the toggle animation system.
- Commit hash(es): none

### 2026-02-19 19:04:08 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Refined pipeline-only background header layout in `css/main.css` by top-aligning the compact section ID with the large section title (`align-items: flex-start` + `line-height: 1`) and moving the first pipeline content block (`.pipeline-note`) upward using responsive negative top margins so it partially overlaps the large background title text.
- Troubleshooting suggestions: If overlap is too aggressive/subtle, tune `#pipeline .pipeline-note` `margin-top` values (`-54/-46/-34`) per breakpoint.
- Resolutions/outcomes: The small `03 \` now aligns with the top of the large `Pipeline` text, and the first content line visually crosses the title by about half as requested.
- Commit hash(es): none

### 2026-02-19 19:28:10 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Increased pipeline-only background title size in `css/main.css` (`5.2rem` desktop, `4.4rem` tablet, `3.2rem` mobile) and strengthened content overlap by increasing `.pipeline-note` negative top margins (`-86/-70/-48`) to create a clearer half-covered large-title effect.
- Troubleshooting suggestions: If you want a little less overlap, reduce `.pipeline-note` negative margins by ~8-12px at each breakpoint; if you want a bolder watermark title, raise the desktop title size from `5.2rem` toward `5.6rem`.
- Resolutions/outcomes: Background `Pipeline` text is larger and the first pipeline object now covers a substantial portion (about half) of the title across viewport sizes.
- Commit hash(es): none

### 2026-02-19 19:30:09 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Refined pipeline background layering in `css/main.css` to keep `PIPELINE` firmly behind content by adding `isolation: isolate` on `#pipeline`, lowering watermark opacity, raising non-header children to `z-index: 2`, and making `.pipeline-note` background substantially more opaque via `color-mix` so the foreground card visually covers the title.
- Troubleshooting suggestions: If title is now too faint, raise `#pipeline > .header-group` opacity slightly (for example `0.13 -> 0.15`) without changing foreground z-index/background opacity.
- Resolutions/outcomes: Pipeline title now reads as a true background watermark and the first content object clearly sits on top of it.
- Commit hash(es): none

### 2026-02-19 19:53:45 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Adjusted pipeline overlap tuning in `css/main.css` to reveal more of the background title by reducing negative top offsets on `.pipeline-note` across breakpoints (`-70` desktop, `-58` tablet, `-40` mobile).
- Troubleshooting suggestions: If you want slightly more/less title reveal, move each offset by ~6-8px in the same direction per breakpoint to keep proportion consistent.
- Resolutions/outcomes: Background `PIPELINE` watermark now shows more vertical area while foreground content still clearly covers it.
- Commit hash(es): none

### 2026-02-19 20:02:42 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Increased pipeline watermark title scale in `css/main.css` (`6.6rem` desktop, `5.6rem` tablet, `4.2rem` mobile) and made it visually fainter by reducing pipeline header opacity (`0.10` desktop, `0.09` tablet) and lowering title color mix intensity.
- Troubleshooting suggestions: If the watermark becomes too faint on certain displays, slightly raise `#pipeline > .header-group` opacity first before changing size values.
- Resolutions/outcomes: `PIPELINE` now appears much larger while reading as a subtler background watermark behind the foreground content.
- Commit hash(es): none

### 2026-02-19 20:14:06 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Removed pipeline in-section header markup from `index.html` and deleted all pipeline-only watermark/overlap CSS overrides from `css/main.css` (`#pipeline` absolute header layer, title sizing/opacity tweaks, and responsive overlap rules), restoring normal pipeline content flow under the tab-based page label.
- Troubleshooting suggestions: If you later want a minimal non-redundant label, add a small `pipeline-option-label` style line only (no absolute overlay) rather than reinstating large background header layers.
- Resolutions/outcomes: Pipeline section no longer shows duplicate in-section header/watermark content and now starts cleanly from the instruction card and map controls.
- Commit hash(es): none

### 2026-02-19 20:17:39 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Reduced top whitespace in pipeline section by adding dedicated `#pipeline` top padding overrides in `css/main.css` (`56px` desktop, `44px` tablet, `36px` mobile), leaving global `.section-wrap` spacing unchanged for other sections.
- Troubleshooting suggestions: If you want it even tighter, lower the three `#pipeline` padding values in parallel by ~8px each.
- Resolutions/outcomes: Extra top space above the first pipeline content block is removed without affecting layout spacing of other tabs/sections.
- Commit hash(es): none

### 2026-02-19 20:21:25 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Added nav/content separator styling in `css/main.css` by removing `nav` default border-bottom and introducing an explicit thin gold line with `nav::after`; adjusted `.header-index` bottom alignment by removing extra bottom padding so tab pills sit directly on the separator.
- Troubleshooting suggestions: If the gold line is too subtle/strong, tune the `color-mix` percentage in `nav::after` background.
- Resolutions/outcomes: A thin gold barrier now separates nav and content, and tabs rest directly on that line as requested.
- Commit hash(es): none

### 2026-02-19 20:22:59 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Eliminated remaining tab-to-divider gap in `css/main.css` by setting nav bottom padding to `0` on desktop/mobile nav rules (`padding: 10px ... 0`) and applying `.header-index { margin-bottom: -1px; }` so tabs physically meet the gold separator.
- Troubleshooting suggestions: If tabs feel too low at certain zoom levels, reduce overlap to `margin-bottom: 0` or `-0.5px`.
- Resolutions/outcomes: Tabs now touch the gold line without visible spacing below.
- Commit hash(es): none

### 2026-02-19 20:30:12 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Applied pipeline title treatment site-wide for tabbed sections by removing in-section heading blocks from `#mandate`, `#rubric`, `#engagement`, and `#team` in `index.html`, and expanded the reduced top-padding override in `css/main.css` to `#mandate/#rubric/#pipeline/#engagement/#team` across desktop/tablet/mobile breakpoints (`56/44/36px`). Then updated primary nav tab interaction styling in `css/main.css`: inactive tabs are shorter by default, hover keeps the outline glow while smoothly scaling up, and active tabs expand taller/wider (`min-height` + `min-width` + padding) so neighboring tabs shift sideways when selected.
- Troubleshooting suggestions: If active tabs wrap too aggressively on smaller widths, reduce active `min-width` (`92px`) and active horizontal padding in the tab-active selector block; if hover growth feels too strong, lower hover scale from `1.035` to `1.02`.
- Resolutions/outcomes: The four requested sections now match pipeline’s no-header presentation, and top navigation tabs now provide clearer state contrast with smooth interactive growth behavior and visible layout push on active selection.
- Commit hash(es): none

### 2026-02-19 20:34:18 -06:00 | Agent: Codex | Version: GPT-5
- Actions taken: Patched tab/hash startup behavior in `js/main.js` to eliminate partial-scroll starts by adding `jumpViewportToTop()` and invoking it after each tab hash activation (`setActiveTabFromHash`), plus enabling `history.scrollRestoration = 'manual'` to avoid browser auto-restoring stale vertical offsets across tab/page revisits.
- Troubleshooting suggestions: If any tab still opens offset, hard-refresh once to clear browser restore state; if you later want back-button position restoration, remove the `scrollRestoration` override and keep only the hashchange top-reset.
- Resolutions/outcomes: Tab sections now initialize and switch from the top of the viewport consistently instead of sometimes starting slightly scrolled down.
- Commit hash(es): none

[AGENTS-LOG-TAIL] ACTIVE_SESSION_UNTIL_CLEAN_CLOSE
