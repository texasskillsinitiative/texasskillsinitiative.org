# TSI Site Product Blueprint

This file defines approved product scope and deferrals for milestone execution.

## 1) Problem / Opportunity
- TSI needs a clear, credible public-facing site that communicates corridor strategy, intake flow, and team posture while preserving legal/compliance readiness.

## 2) Goals / Non-Goals
- Goals:
  - Deliver a stable launch-ready static site with strong map/pipeline storytelling and structured engagement intake.
  - Maintain clear governance and risk/rollback discipline for autonomous agent work.
- Non-goals:
  - Backend platform migration or major architecture replacement before launch.
  - Unapproved expansion of sections/workflows beyond milestone scope.

## 3) Target Users / Stakeholders
- Regional and institutional stakeholders evaluating TSI.
- Internal operators maintaining content, legal posture, and launch readiness.

## 4) Scope Boundaries
- In-scope: `index.html`, `css/main.css`, `js/main.js`, legal pages, governance docs, and map assets.
- Deferred: post-launch feature expansion not represented in `STATUS.md`.

## 5) MVP (`1.0`) Definition
- Public site sections are stable and navigable.
- Engagement flow validates and submits expected metadata.
- Pipeline map modes function with responsive behavior and controlled overlays/switches.
- Legal/SEO baseline pages and metadata are present.

## 6) Post-MVP (`2.0`) Direction
- Enhanced analytics/instrumentation.
- Expanded content operations and optional interaction improvements.
- Hardening and optimization based on production feedback.

## 7) Implementation Strategy
- Static site architecture with packet-scoped changes.
- Milestone execution tracked in `STATUS.md` with risk/rollback notes.
- Packet boundaries and ownership tracked in `PACKETS.md`.

## 8) Risks / Assumptions / Dependencies
- Risk: map parsing/toggle complexity across evolving MD formats.
- Assumption: repository remains private during pre-launch hardening.
- Dependency: final legal/entity copy approvals and production endpoint confirmation.

## 9) Launch Readiness Checks
- Core section smoke checks and interaction checks.
- Responsive checks at `900px` and `600px`.
- Console error check and link pass across core/legal pages.

## 10) Operating Rule
- If scope changes materially, update this file first, then align `STATUS.md`.
