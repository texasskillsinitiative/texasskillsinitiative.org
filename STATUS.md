# TSI Site Status

Last updated: 2026-02-20
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
- [Done] Removed MD toggle-point blink animation wiring so toggle markers render as static points (legacy trailing blink column is now ignored).
- [Done] Improved map-toggle overlay switching smoothness by gating inactive overlays with `visibility`/`pointer-events` and tightening opacity transition timing.
- [Done] Added category-scoped default toggle marker colors (Initial/Structured/Technical/Reference) with theme-specific token values and `accent` fallback behavior in MD toggle parsing.
- [Done] Removed map control buttons from the pipeline UI (MD + legacy blocks) and retired control-generation/runtime toggle handlers; MD-authored category markers now render together by default.
- [Done] Restored MD category toggle controls (legacy controls remain removed) and wired button accent/border colors to each category marker color for visual parity.
- [Done] Added Phase 1 premium map polish: low-cost frame sheen sweep (`transform` animation on pseudo-element) plus reduced-motion fallbacks for sheen and map control/overlay transitions.
- [Done] Added Phase 2 premium map polish: active-toggle pulse ring and hover micro-lift/label easing for map markers (desktop hover), with reduced-motion-safe fallbacks.
- [Done] Implemented one-layer pointer-reactive map highlight (single frame overlay moved via RAF-throttled `transform`) gated to fine-pointer + non-reduced-motion contexts.
- [Done] Upgraded pointer layer from white glow to blend-mode inversion reveal (`mix-blend-mode: difference`) so the single overlay flips underlying map tones in-place without per-dot redraw.
- [Done] Reduced pointer inversion layer footprint to a dot-scale target (~7 dots across) by sizing the overlay from current map grid pitch per breakpoint.
- [Done] Added temporary layer-inspection switches in map controls (`Full Layer 100%`, `Full Layer 50%`) to force full-frame blend-layer previews for visual tuning/testing.
- [Done] Tuned pointer reveal edge profile to a near-binary mask: full-opacity interior with ~0.5px fade at the perimeter.
- [Done] Expanded temporary layer-inspection switches to `100/90/80/70/60` and changed preview logic to variable-opacity full-frame mode.
- [Done] Added pointer-reveal persistence via RAF smoothing (position easing) plus short leave linger before fade-out.
- [Done] Added temporary live tuning strip (text boxes) for pointer layer values: size-in-dots, falloff px, active opacity, easing, and leave linger ms.
- [Done] Added `Reset Defaults` control for the temporary tuning strip to restore all pointer-layer tuning values in one click.
- [Done] Expanded temporary full-layer opacity preview buttons to all 10% increments (`100` through `10`).
- [Done] Added temporary on-page modifier guidance and integrated reset behavior into live tuning workflow for faster local iteration.
- [Done] Reworked pointer persistence from eased head-follow to immediate head + decaying trail ghost so motion reads as a trail instead of cursor lag.
- [Done] Updated tuning-strip modifier copy to plain-language guidance for each text box (diameter, edge, strength, trail catch-up, fade duration).
- [Done] Replaced the chasing-ghost persistence with stamped fade-trail prints so cursor movement leaves gentle fading footprints instead of delayed tracking.
- [Done] Added optional `Hover Flash` mode toggle that inverts nearby map dots on mouse move and quickly fades them back, while disabling trail rendering when active (mutually exclusive modes).
- [Done] Retuned trail mode into a softer ghost profile (higher stamp density, lower opacity, blur, and longer fade) for a smoother lingering afterimage.
- [Done] Split map tuning controls by active pointer mode: trail-only controls are hidden in `Hover Flash` mode and flash-only controls are hidden in trail mode.
- [Done] Replaced manual `Hover Flash` tuners with varied presets (`Compact`, `Balanced`, `Wide`, `Lingering`) and mode-scoped reset behavior.
- [Done] Updated `Hover Flash` `Compact` preset to strict single-dot behavior (`radiusCells: 0.5`, `centerOnly`) and aligned helper copy.
- [Done] Added combinable flash linger tuning in `Hover Flash` mode: duration test buttons (`Linger 190/260/340/460/620`) plus `Lingering Ms` text input for custom fade length on top of any flash preset (including `Compact`).
- [Done] Added autonomous rolling column glow sweep (left-to-right) using strict two-column state (`lead` + `fading`) so no more than two columns glow/fade simultaneously.
- [Done] Added `Glow Tests` controls in flash mode, including `Glow Tail` (compact single-dot linger trail on/off).
- [Done] Removed frame-only vertical sheen sweep effect from map frame and retargeted glow tuning controls to the map column-sweep effect (`Max Opacity`, `Active Lines`, `Speed Ms`).
- [Done] Added low-cost color-aware hover flash (water/land/override-aware flash color variables) and updated linger test buttons to efficient longer timings (`460/720/960/1440/2000` ms).
- [Done] Added `Force Sweep On` test toggle to bypass reduced-motion gating for local glow-sweep verification.
- [Done] Fixed invisible glow-sweep regression by removing CSS hard-`opacity: 0` override on column lines and driving line opacity via inline runtime styles.
- [Done] Removed the visible MD source label above the pipeline map, added delayed first-category default activation (only first toggle on after map render), softened active-toggle pulse timing, added click-helper copy, and added below-map category descriptions sourced from optional `world-map.md` toggle description fields.
- [Done] Reworked MD category controls into a fixed two-column map-control grid (`toggle` + `description` per row), with equal-size toggle buttons stacked vertically and category explanations aligned to the right of each toggle.
- [Done] Adjusted category row sizing and typography: reduced toggle/button height, set explanation text to site body scale, allowed explanation rows to auto-grow only when wrapping, and added one-shot map-frame color flash on category activation.
- [Done] Softened/slowed category activation frame flash, made explanation cells visually collapsed-left while inactive and expand on activation, and restored startup sprinkle reveal to run even when sweep is disabled.
- [Done] Reduced frame-to-map inner gap sizing by half (`padding` + gap ring), added synchronized inner-gap flash fill keyed to category color mix, and tightened collapsed description behavior to fully fold left until active.
- [Done] Locked category control rows to fixed heights and constrained description text to single-line ellipsis so collapsed/expanded states change only width (no vertical growth/layout shift).
- [Done] Normalized category row box-model sizing (`box-sizing: border-box`) for both toggle buttons and description cells so rendered heights match exactly at all breakpoints.
- [Done] Slowed description panel expand/collapse timing and aligned it with frame flash animation duration/curve for synchronized toggle feedback.
- [Done] Retimed toggle-controlled map overlays to match panel/frame timing (`1.1s` cubic-bezier), including delayed `visibility` hide so markers fade out smoothly instead of cutting off.
- [Done] Updated pipeline-only background header layering so `03 \` top-aligns with `Pipeline` title and first pipeline content overlaps the title area by roughly half without reserving extra layout space.
- [Done] Increased pipeline background `Pipeline` title scale and retuned first-object overlap so the opening content block covers roughly half of the larger background title across breakpoints.
- [Done] Forced pipeline title layer deeper into the background (`isolation` + lower header opacity + higher foreground z-index) and made the first content block background more opaque so foreground content clearly covers the title.
- [Done] Fine-tuned pipeline first-card overlap to increase watermark visibility target (~40% vertical title visibility) by relaxing negative top offsets per breakpoint.
- [Done] Increased pipeline background title scale further and reduced its intensity (lower opacity + fainter color mix) to keep it large but clearly watermark-like behind content.
- [Done] Removed the custom pipeline watermark header treatment entirely (markup + CSS overrides), returning pipeline to clean top content flow without redundant in-section title text.
- [Done] Reduced pipeline top whitespace after header removal by adding pipeline-specific top padding overrides (`56/44/36px` desktop/tablet/mobile).
- [Done] Added a dedicated thin gold nav/content divider and removed tab bottom offset so tab pills sit directly on the divider line.
- [Done] Removed residual nav bottom inset by zeroing nav bottom padding and applying a slight tab-row bottom overlap (`-1px`) so tabs physically touch the gold divider.
- [Done] Applied the pipeline no-header title treatment to `mandate`, `rubric`, `engagement`, and `team` by removing in-section header blocks and sharing the reduced top-padding profile (`56/44/36px`) across those sections.
- [Done] Updated primary nav tab interaction model: inactive tabs now render shorter by default, hover state keeps outline glow plus smooth scale-up, and active tabs expand taller/wider so neighboring tabs shift aside.
- [Done] Fixed tab-section startup scroll drift by forcing hash-tab activation to reset viewport to top and setting browser history scroll restoration to `manual` in `js/main.js`.
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
- [Done] 2026-02-19: Removed toggle marker blink-class rendering and retired marker blink keyframes so MD toggle points render without animation.
- [Done] 2026-02-19: Updated map overlay visibility model (`opacity + visibility + pointer-events`) to reduce unnecessary interaction/paint work on inactive toggle groups.
- [Done] 2026-02-19: Added map toggle category color tokens for both themes and wired `accent` toggle colors to resolve category token first, then fallback to `var(--map-accent)`.
- [Done] 2026-02-19: Removed below-map overlay toggle controls from `index.html`, removed legacy/MD control runtime handlers in `js/main.js`, and simplified map overlay rendering to always-on category marker display.
- [Done] 2026-02-19: Reintroduced MD-driven category toggles only (legacy toggle UI remains retired) and set toggle button color to match the associated category marker color.
- [Done] 2026-02-19: Added map-frame sheen animation and `prefers-reduced-motion` handling to keep visual polish while minimizing runtime overhead.
- [Done] 2026-02-19: Added active map-toggle pulse-ring animation and marker hover micro-lift/text easing (hover-capable pointers only), with reduced-motion fallback disabling new motion.
- [Done] 2026-02-19: Added one-layer pointer glow overlay on map frame with `requestAnimationFrame` pointer updates and media-query gating (`hover/pointer` + reduced-motion) to preserve performance.
- [Done] 2026-02-19: Replaced pointer white-glow styling with blend-mode inversion spotlight (theme-tuned opacity), producing an opposite-tone reveal effect aligned to existing map content.
- [Done] 2026-02-19: Tuned pointer inversion radius from fixed large spotlight to grid-relative size (`~7` dot cells, clamped) for tighter map-detail reveal.
- [Done] 2026-02-19: Added temporary full-layer preview switches in controls and frame-level debug classes to inspect blend-layer output at 100% and 50% opacity.
- [Done] 2026-02-19: Changed pointer spotlight profile to 100% interior opacity with abrupt edge cutoff (`~0.5px` falloff) and raised active spotlight opacity to full for direct edge inspection.
- [Done] 2026-02-19: Updated layer preview controls to five levels (`100/90/80/70/60`) using `--map-layer-preview-opacity` and unified `map-layer-preview-active` frame class.
- [Done] 2026-02-19: Updated pointer glow runtime to eased RAF tracking with trailing persistence and delayed class clear (`~160ms`) on pointer leave.
- [Done] 2026-02-19: Added map-control-adjacent tuning inputs that write directly to frame CSS vars/datasets for live visual testing of pointer glow behavior.
- [Done] 2026-02-19: Added tuning-strip reset action (`Reset Defaults`) and extended full-layer preview button set from partial steps to full 10% increments (`100..10`).
- [Done] 2026-02-19: Added explanatory helper text for tuning modifiers in map controls and preserved one-click reset to baseline defaults for all editable fields.
- [Done] 2026-02-19: Converted pointer linger behavior to trail-style rendering (snap-to-cursor head + decaying ghost pass) and relabeled `Ease` as `Trail Ease` to match runtime behavior.
- [Done] 2026-02-19: Replaced the decaying ghost follower with pooled print-stamp trail rendering (density tied to `Trail Ease`, fade tied to `Linger Ms`) for a cleaner non-lag trail feel.
- [Done] 2026-02-19: Added mutually exclusive `Hover Flash` pointer mode in map controls to run per-dot invert/fade pulses on hover (center + near neighbors), with trail/head glow suppressed while flash mode is active.
- [Done] 2026-02-19: Softened trail rendering profile by increasing print pool size and overlap, reducing per-print opacity, extending fade duration, and adding blur/soft radial print styling for a true ghost-trail look.
- [Done] 2026-02-19: Added mode-scoped tuning UI visibility and reset behavior so only active-mode controls are shown (trail vs flash), preventing cross-mode control clutter.
- [Done] 2026-02-19: Replaced hover-flash live controls with curated presets (including +/- one-step size variants) and mapped runtime radius/duration/intensity/grid timing to selected preset values.
- [Done] 2026-02-19: Updated `Flash Compact` hover behavior to use opposite land/water flash colors (land flashes with water palette, water flashes with land palette) while keeping non-compact flash palettes unchanged.
- [Done] 2026-02-19: Removed non-compact flash preset options from map controls and runtime defaults; `Hover Flash` now runs compact-only while preserving compact linger and glow tuning controls.
- [Done] 2026-02-19: Refined compact opposite-color flash to use exact base terrain colors (`--map-dot-water` / `--map-dot-land`) instead of accent-tinted opposite colors.
- [Done] 2026-02-19: Removed compact flash luminance boost by disabling invert/brightness/saturation filtering for compact opposite-color flash (WAAPI + fallback paths), so compact now displays only color swap.
- [Done] 2026-02-19: Added live glow-sweep cost meter in flash `Glow Tests` (line updates/s, DOM writes/s, and relative load vs defaults) and fixed unmatched `var(...)` parentheses in `mapDotHoverFlash` keyframes that were breaking downstream tab/layout CSS parsing.
- [Done] 2026-02-19: Updated map column sweep so each new lead column quickly reveals top-to-bottom before entering trailing fade columns, replacing instant full-height lead-column pop-in.
- [Done] 2026-02-19: Added `Load Ms` glow control for vertical lead-column top-to-bottom reveal speed, with dataset/default/reset wiring (`20..600ms`) independent of column sweep step speed.
- [Done] 2026-02-19: Added one-time initial map reveal tied to the sweep lead edge by clipping the SVG left-to-right during first sweep pass, then clearing clip and marking completion (`mapGlowInitialRevealDone`) so subsequent sweeps run normally.
- [Done] 2026-02-19: Added first-sweep-only startup speed control (`Startup Speed Ms`) that drives initial sweep cadence before auto-returning to normal `Speed Ms`; added always-visible map test dock near map title plus dynamic per-effect diagnostics (`Trail`, `Flash Compact`, `Sweep`, `Startup Sweep`) that update as tuning values change.
- [Done] 2026-02-19: Reorganized map test UI into labeled groups (`Flash Tail Tests`, `Sweep Actions`, `Sweep Tests`, `Linger Tests`, `Effect Readout`), removed bottom-row debug buttons next to map category toggles (`Hover Flash` + `Full Layer %`), forced flash-mode behavior with `Glow Tail`, replaced `Force Sweep On` with `Reset Sweep` (replays first-load draw), and removed legacy trail-only tuning fields from the test panel.
- [Done] 2026-02-19: Split sweep tuning into two full rows: `Startup Sweep Tests` (`Max Opacity`, `Active Lines`, `Speed Ms`, `Load Ms`) applied only during first-pass draw, and `Sweep Tests` with the same fields applied to ongoing post-startup sweep behavior.
- [Done] 2026-02-19: Moved `Linger Tests` directly under `Flash Tail Tests` (`Glow Tail`) so linger controls are scoped to compact flash/glow-tail tuning, and adjusted sweep trailing fade by terrain mix (slightly longer decay over land-heavy columns, slightly faster decay over ocean-heavy columns).
- [Done] 2026-02-19: Added `Tail = Load` sweep action toggle that binds trailing-line reveal/fade timing to `Load Ms`; when enabled, trailing lines animate with slight per-line vertical offsets (not identical heights) for clearer staggered tail layering.
- [Done] 2026-02-19: Lowered sweep speed minimums to `8ms` for both `Startup Sweep Tests` and `Sweep Tests` (runtime clamps + UI input clamps + readout math), enabling faster-than-20ms sweep testing.
- [Done] 2026-02-19: Prevented vertical reveal pop-in at high `Load Ms` by scheduling sweep steps with effective phase cadence `max(Speed Ms, Load Ms)` (startup and runtime), so a column’s top-to-bottom reveal can finish before the next reassignment.
- [Done] 2026-02-19: Refined `Tail = Load` tail-line geometry so middle/trailing lines animate top-to-bottom with `y=0` anchoring (no top blank pixels) and apply only bottom-edge staggering for final fade-line level separation.
- [Done] 2026-02-19: Updated map glow defaults to current test baseline (`Startup: opacity 1, lines 3, speed 20, load 20`; `Runtime: opacity 0.1, lines 3, speed 1200, load 600`; `Flash linger 80ms`) and added sweep burn-dissipation behavior where the prior trailing column fades top-to-bottom instead of popping out.
- [Done] 2026-02-19: Added `Lead Full` sweep action toggle to force head-line opacity to `1.0` independently of startup/runtime `Max Opacity` settings.
- [Done] 2026-02-19: Removed vertical reveal/scroll behavior from middle sweep columns; middle columns now render full-height and fade by opacity only, while only the lead column loads top-to-bottom and trailing burn dissipation remains top-to-bottom.
- [Done] 2026-02-19: Added optional thin front-edge sweep indicator (`Edge Line`) under `Sweep Actions`, rendering a narrow solid lead-edge line in the inter-dot column gap; wired defaults/reset/readout state (`edge-line on/off`).
- [Done] 2026-02-19: Added test-mode `Sweep On` toggle under `Sweep Actions` to fully enable/disable sweep rendering without losing settings; wired dataset defaults/reset and updated effect readout to report disabled state when off.
- [Done] 2026-02-19: Added startup reveal mode option (`Startup Sweep` / `Startup Sprinkle`) with testing controls (`Sprinkle Ms`, `Step Ms`, `Seed`) and deterministic seeded sprinkle runtime that starts from blank dots and reveals in batches; startup readout now reports mode-specific diagnostics.
- [Done] 2026-02-19: Switched startup defaults to the selected sprinkle baseline (`Startup Mode=Sprinkle`, `Sprinkle Ms=1500`, `Step Ms=20`, `Seed=37`) and aligned reset/default initialization to the same values.
- [Done] 2026-02-19: Set sweep default to off (`Sweep On` inactive by default, including reset defaults) and hid map test dock from end users by default; added private reveal toggle (`Ctrl+Shift+M`) plus optional query flag (`?maptests=1` / `?maptests=0`) with localStorage persistence.
- [Done] 2026-02-19: Scoped test-panel keyboard toggle so `Ctrl+Shift+M` only works while `TSI INTERNAL` modal (`#portalModal`) is open/visible on screen.
- [Done] 2026-02-19: Fixed hidden test-dock reliability by enforcing inline display sync (`grid`/`none`) instead of relying only on `[hidden]` (which was being overridden by CSS), removed default persisted visibility (reload now hides unless explicit `?maptests=1`), and added on-screen hotkey confirmation toast (`Map test settings shown/hidden`).
- [Done] 2026-02-19: Promoted test-panel visibility to a site-global persistent setting controlled only by `Ctrl+Shift+M` while `TSI INTERNAL` modal is open; visibility now applies to both `[data-map-tests]` and `[data-test-settings]`, syncs for dynamically injected panels, and URL query overrides were removed to prevent accidental exposure paths.
- [Done] 2026-02-20: Updated MD map toggle UX by removing the source label line, activating only the first category by default after render, adding helper click behavior text, and wiring optional category descriptions from `assets/world-map.md` into dim/active synced readouts below the map.
- [Done] 2026-02-20: Updated category-toggle layout to a 2-column by category-count grid (`toggle` left, explanation right), enforced uniform toggle width/height, and moved description activation state sync to inline control rows.
- [Done] 2026-02-20: Tuned map category rows to shorter controls with body-sized explanation text (`0.8rem`), made description cells match button height by default with wrap-driven growth, and added non-persistent frame-edge flash keyed to active category color on toggle-on events.
- [Done] 2026-02-20: Slowed frame-flash animation for gentler category activation feedback, set inactive explanation boxes to collapsed-left state until active, and fixed startup sprinkle regression by allowing sprinkle intro to execute once even when `Sweep On` is off.
- [Done] 2026-02-20: Halved map-frame inner spacing (`16->8`, `12->6`), added in-sync inner gap flash layer that uses a secondary/tinted category color mix, and ensured startup sprinkle still runs when sweep remains off.
- [Done] 2026-02-20: Stabilized map control layout by setting fixed grid row heights per breakpoint and enforcing one-line description truncation, preventing map position shifts while toggle descriptions expand/collapse horizontally.
- [Done] 2026-02-20: Corrected residual button/description height mismatch by applying border-box sizing to both cell types under the MD map control grid.
- [Done] 2026-02-20: Retimed description expansion transitions to `1.1s` with the same cubic-bezier curve used by frame/gap flash animations so text-panel motion and frame color effects run in sync.
- [Done] 2026-02-20: Updated `.map-overlay` show/hide transitions to the same `1.1s` easing profile as toggle/text panels, with deferred visibility change on hide for clean fade-out.
- [Done] 2026-02-20: Adjusted `#pipeline` background header alignment (`align-items: flex-start`, line-height tuning) and applied responsive negative top margins on `.pipeline-note` to partially cover the large title text while keeping pipeline content in normal document flow.
- [Done] 2026-02-20: Upscaled pipeline background title sizing (`5.2rem` desktop, `4.4rem` tablet, `3.2rem` mobile) and increased responsive negative top offsets on `.pipeline-note` (`-86/-70/-48`) to achieve a stronger half-cover effect.
- [Done] 2026-02-20: Strengthened foreground-over-background read by isolating `#pipeline` stacking context, raising non-header content to `z-index:2`, reducing header watermark opacity, and setting a denser pipeline-note background blend so the card sits visually above the title.
- [Done] 2026-02-20: Retuned pipeline-note overlap offsets from `-86/-70/-48` to `-70/-58/-40` (desktop/tablet/mobile) to show more of the background `Pipeline` title while preserving foreground dominance.
- [Done] 2026-02-20: Upscaled background `Pipeline` title to `6.6/5.6/4.2rem` (desktop/tablet/mobile) and lowered header opacity/color intensity (`0.10/0.09` + softer color-mix) for a larger, fainter watermark presentation.
- [Done] 2026-02-20: Removed pipeline in-section header block from `index.html` and deleted all pipeline-specific background-header/overlap CSS so the tab bar remains the only section label and pipeline content starts unobstructed.
- [Done] 2026-02-20: Tightened pipeline section vertical start position by overriding `#pipeline` top padding across breakpoints to eliminate residual empty space above the first content block.
- [Done] 2026-02-20: Replaced nav bottom border with explicit gold separator (`nav::after`) and set `.header-index` bottom padding to `0` so tab controls rest directly on the separator.
- [Done] 2026-02-20: Finalized tab-to-divider contact by updating nav padding to `10px ... 0` (desktop/mobile breakpoints) and setting `.header-index` bottom margin to `-1px`.

## Active Focus
- Delivery target: Friday, February 20, 2026 (end of day, local).
- Priority 1: finish pipeline/map completion and validation first (`Milestone 0.6` map implementation/readiness items + `R-001` checks).
- Priority 2: complete remaining `Milestone 0.6` launch-readiness QA (form, modal, navigation, theme, responsive, accessibility, links).
- Priority 3: proceed to `Milestone 0.7` content/compliance sign-off only after `0.6` is stable.
- Keep map work edits confined to:
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
