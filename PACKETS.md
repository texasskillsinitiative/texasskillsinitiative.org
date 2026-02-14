# Concurrent Work Packets

Purpose: enable multiple agents/users to work in parallel with minimal overlap and no cross-contamination.

Last updated: 2026-02-14

## Core Rules
1. One active owner per packet at a time.
2. One branch per packet (do not share branches across packets).
3. Keep commits packet-scoped (only files listed for that packet).
4. If a change must cross packet boundaries, split into separate commits by packet.
5. If packet boundaries change, update this file in the same change set.

## Packet Map

## Packet A - Intake Form + Modal Logic
Primary scope:
- `index.html` (access modal markup and form fields)
- `js/main.js` (concierge flow, form validation, submit lifecycle, hold-to-clear)
- `css/main.css` (form/modal/concierge styles)

Out of scope:
- Pipeline/map blocks
- Legal pages
- `tsi_internal.html` VPN gate page

Suggested branch:
- `packet-a-intake-form`

## Packet B - Pipeline + Map
Primary scope:
- `index.html` (pipeline section only)
- `js/main.js` (`initPipelineMap` and map overlay handlers only)
- `css/main.css` (pipeline/map classes only)
- `assets/world-map.md`
- `assets/world-map.png`
- `assets/world-map.svg`
- `World_map_without_Antarctica.svg`

Out of scope:
- Team section content
- Legal pages
- Form submission logic

Suggested branch:
- `packet-b-pipeline-map`

## Packet C - Team + Staff Content
Primary scope:
- `index.html` (team/staff section only)
- `css/main.css` (staff/team classes only)
- `assets/hr/*` (staff images/headshots)

Out of scope:
- Pipeline/map
- Legal/policy pages
- Form backend logic

Suggested branch:
- `packet-c-team-staff`

## Packet D - Internal Access + Remote Node
Primary scope:
- `index.html` (portal modal and launch points)
- `js/main.js` (portal simulation logic)
- `css/main.css` (portal/vpn styles)
- `tsi_internal.html`

Out of scope:
- Legal pages
- Pipeline/map
- Team content (except portal entry points if needed)

Suggested branch:
- `packet-d-internal-access`

## Packet E - Legal + Compliance + SEO
Primary scope:
- `privacy.html`
- `terms.html`
- `security.html`
- `accessibility.html`
- `404.html`
- `sitemap.xml`
- `robots.txt`

Out of scope:
- Feature logic in `js/main.js`
- Major layout changes in `index.html`

Suggested branch:
- `packet-e-legal-seo`

## Packet F - Governance + Planning Docs
Primary scope:
- `AGENTS.md`
- `STATUS.md`
- `AGENTS-LOG.md`
- `PACKETS.md`

Out of scope:
- Runtime site features unless explicitly requested

Suggested branch:
- `packet-f-governance-docs`

## Shared Files (High Collision Risk)
- `index.html`
- `css/main.css`
- `js/main.js`

If multiple packets need one shared file:
1. Use strict section-level ownership.
2. Stage and commit only the owned hunks.
3. Rebase frequently and resolve conflicts immediately.
4. Avoid formatting-only sweeps across shared files.

## Handoff Protocol
1. Before starting, claim packet + branch in `AGENTS-LOG.md`.
2. During work, keep periodic log entries with changed files.
3. Before merge, verify changed files are inside packet scope.
4. If cross-packet dependency exists, open a handoff note in `AGENTS-LOG.md` with:
- dependency packet
- required file(s)
- exact expected follow-up

## Merge Order (Default)
1. Packet A (form core)
2. Packet B (pipeline/map)
3. Packet C (team/staff)
4. Packet D (internal access)
5. Packet E (legal/SEO)
6. Packet F (docs/governance)

Use this order unless the user sets a different priority.
