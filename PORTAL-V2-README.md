# Portal V2 Integration Notes

This package is additive-only and does not modify existing site files.

## New pages
- `portal-hub.html`
- `portal-investment.html`
- `portal-press.html`
- `portal-employment.html`
- `portal-internship.html`

## Shared assets
- `css/portal-expansion.css`
- `js/portal-intake-v2.js`

## Dedicated backend package
- `form-backend/portal_v2_config.js`
- `form-backend/portal_v2_apps_script_webapp.js`

## Routes covered
- `investment`
- `press`
- `employment`
- `internship`

## Notes
- Employment page intentionally accepts applications regardless of active openings.
- Internship page is structured as a fuller application and requires resume upload.
- Investment page is positioned as inquiry-oriented rather than job-application style.

## Merge-time link wiring (later)
When ready to integrate into main nav/footer, point links to:
- `portal-hub.html` (entry)
- `portal-investment.html`
- `portal-press.html`
- `portal-employment.html`
- `portal-internship.html`

## Deploy-time backend setup
Create separate Apps Script project for portal v2 backend and deploy web app with:
- `portal_v2_config.js`
- `portal_v2_apps_script_webapp.js`

Set script properties at minimum:
- `PORTAL_V2_SPREADSHEET_ID`

Optional:
- sheet names per route
- per-route upload folder IDs
- rate limit / max message / max file
- admin email

Then update endpoint in `js/portal-intake-v2.js` (`PORTAL_V2_ENDPOINT`) or set per-form `data-endpoint`.
