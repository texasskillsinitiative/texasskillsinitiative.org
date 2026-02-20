# Asset Inventory Baseline (2026-02-20)

Scope: `assets/` references scanned against `index.html`, legal pages, `tsi_internal.html`, `css/main.css`, `js/main.js`, `site.webmanifest`, `sitemap.xml`, and `robots.txt`.

## Naming Convention (Rolled Out)
- Global shared assets: `assets/global/{logo|icon}/...`
- Page-scoped assets: `assets/pages/{mandate|rubric|pipeline|team}/...`
- Legacy/unwired variants remain in original folders until archive/remove decisions are approved.

## Referenced Core Assets
- Global logo/icon assets:
  - `assets/global/logo/tsi-main-dark.svg`
  - `assets/global/logo/tsi-main-light.svg`
  - `assets/global/icon/tsi-favicon.svg`
  - `assets/global/icon/tsi-favicon-32.png`
  - `assets/global/icon/tsi-app-android-192.png`
  - `assets/global/icon/tsi-app-apple-180.png`
- Mandate:
  - `assets/pages/mandate/mandate-corridor-illustration.png`
- Rubric:
  - `assets/pages/rubric/rubric-analysis-banner.png`
  - `assets/pages/rubric/rubric-icon-vocational-literacy.png`
  - `assets/pages/rubric/rubric-icon-onboarding-velocity.png`
  - `assets/pages/rubric/rubric-icon-regulatory-coherence.png`
  - `assets/pages/rubric/rubric-icon-reliability.png`
- Pipeline:
  - `assets/pages/pipeline/pipeline-world-map.md`
  - `assets/pages/pipeline/pipeline-world-map.png`
- Team:
  - `assets/pages/team/team-founder-michael.jpg`
  - `assets/pages/team/team-tab-community.png`
  - `assets/pages/team/team-tab-operations.png`
  - `assets/pages/team/team-manager-elena.png`
  - `assets/pages/team/team-manager-laura.png`
  - `assets/pages/team/team-portrait-laura.png`
  - `assets/pages/team/team-gallery-community-session.png`
  - `assets/pages/team/team-gallery-operations-coordination.png`

## Unreferenced Candidates
- General:
  - `assets/asset_2a.png`
  - `assets/favicon.svg`
  - `assets/world-map.svg`
  - `assets/new 3.txt` (non-production text file)
- HR portraits/variants not currently wired:
  - `assets/hr/hs_evan.png`
  - `assets/hr/hs_meghan.png`
  - `assets/hr/hs_michael2.jpg`
  - `assets/hr/sf_elena.png`
  - `assets/hr/sf_elena02.png`
  - `assets/hr/sf_laura.png`
  - `assets/hr/sf_laura02.png`
- Logo derivative packs not currently wired:
  - `assets/logo/tsi-logo-main-dark-42.png`
  - `assets/logo/tsi-logo-main-dark-50.png`
  - `assets/logo/tsi-logo-main-dark-65.png`
  - `assets/logo/tsi-logo-main-dark-84.png`
  - `assets/logo/tsi-logo-main-dark-100.png`
  - `assets/logo/tsi-logo-main-dark-130.png`
  - `assets/logo/tsi-logo-main-dark-195.png`
  - `assets/logo/tsi-logo-main-light-42.png`
  - `assets/logo/tsi-logo-main-light-50.png`
  - `assets/logo/tsi-logo-main-light-65.png`
  - `assets/logo/tsi-logo-main-light-84.png`
  - `assets/logo/tsi-logo-main-light-100.png`
  - `assets/logo/tsi-logo-main-light-130.png`
  - `assets/logo/tsi-logo-main-light-195.png`
  - `assets/logo/tsi-logo-tn-favicon-border.png`
  - `assets/logo/tsi-logo-tn-favicon-border.svg`
  - `assets/logo/tsi-logo-tn-star-pad.svg`
  - `assets/logo/tsi-logo-tn-star-pad-54.png`
  - `assets/logo/tsi-logo-tn-star-pad-72.png`
  - `assets/logo/tsi-logo-tn-star-pad-139.png`
  - `assets/logo/tsi-logo-tn-star-pad-278.png`
  - `assets/logo/tsi-logo-tn-star-trim.svg`
  - `assets/logo/tsi-logo-tn-star-trim-24.png`
  - `assets/logo/tsi-logo-tn-star-trim-48.png`
  - `assets/logo/tsi-logo-tn-star-trim-64.png`
  - `assets/logo/tsi-logo-tn-star-trim-124.png`
  - `assets/logo/tsi-logo-tn-star-trim-248.png`

## Recommended Next Pass
1. Confirm whether unreferenced HR/logo variants are intentional archive assets or removal candidates.
2. Remove or archive `assets/new 3.txt` from production tree.
3. If assets are retained for future use, relocate to a clearly named archive folder (for example `assets/_archive/`) and keep active assets in the global/page-scoped structure.
