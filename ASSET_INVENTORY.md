# Unused Asset Inventory (2026-03-11)

Scope: live-reference audit of `assets/` against the current shipping surface:
- root `*.html`
- `css/*.css`
- `js/*.js`
- `site.webmanifest`
- embedded asset pages under `assets/pages/overview/` and `assets/pages/gate/`

Note: this file now tracks unused candidates only. It does not list actively referenced assets.

## Unused Candidates

### General
- `assets/favicon.svg`
- `assets/world-map.svg`

### Global Logo Variants
- `assets/global/logo/tsi-logo-main-dark.png`
- `assets/global/logo/tsi-logo-main-light.png`
- `assets/global/logo/tsi-logo-tn-badge-dark.png`
- `assets/global/logo/tsi-logo-tn-badge-dark.svg`
- `assets/global/logo/tsi-logo-tn-badge-light.png`
- `assets/global/logo/tsi-logo-tn-badge-light.svg`
- `assets/global/logo/tsi-logo-tn-star.png`

### HR Variants

### Logo Derivative Packs
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

### Page Assets Not Currently Wired
- `assets/pages/team/team-manager-elena.png`
- `assets/pages/team/team-manager-laura.png`
- `assets/pages/team/team-portrait-laura.png`

### Overview Runtime Variants Not Currently Wired
- `assets/pages/overview/globe-v4.1-desktop-stable.html`
- `assets/pages/overview/globe-v4.1-desktop-stable-original.html`

## Notes
- `assets/pages/overview/data/countries-110m.json`, `land-110m.json`, and `us-states-10m.json` are in active use by the overview/lab/gate globe pages and are not unused.
- `assets/pages/gate/globe-beta-gate.html` is in active use by `js/gate.js` and is not unused.
- `assets/hr/sf_laura.png` is mentioned in older inventory notes but is not present in the current `assets/` tree.
