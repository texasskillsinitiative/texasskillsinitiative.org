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

## Unified compatibility mode (V2 endpoint replacing production path)
This V2 backend now supports both:
- legacy intake routes (`stakeholder`, `investor`, `employment` from `js/main.js`)
- portal routes (`investment`, `press`, `employment`, `internship` from `js/portal-intake-v2.js`)

`form-backend/apps_script_webapp.js` remains unchanged for testing/rollback.

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
- legacy sheet/spreadsheet routing:
  - `PORTAL_V2_LEGACY_SPREADSHEET_ID`
  - `PORTAL_V2_LEGACY_INVESTOR_SPREADSHEET_ID`
  - `PORTAL_V2_LEGACY_EMPLOYMENT_SPREADSHEET_ID`
  - `PORTAL_V2_LEGACY_STAKEHOLDER_SHEET_NAME` (default `responses`)
  - `PORTAL_V2_LEGACY_INVESTOR_SHEET_NAME` (default `investor_responses`)
  - `PORTAL_V2_LEGACY_EMPLOYMENT_SHEET_NAME` (default `employment_responses`)
- per-route upload folder IDs
- legacy upload folder override (`PORTAL_V2_LEGACY_UPLOAD_FOLDER_ID`)
- legacy per-route upload folder overrides:
  - `PORTAL_V2_LEGACY_STAKEHOLDER_UPLOAD_FOLDER_ID`
  - `PORTAL_V2_LEGACY_INVESTOR_UPLOAD_FOLDER_ID`
  - `PORTAL_V2_LEGACY_EMPLOYMENT_UPLOAD_FOLDER_ID`
- rate limit / max message / max file
- admin email
- auto-reply controls:
  - `PORTAL_V2_AUTO_REPLY_ENABLED` (`true`/`false`, default `false`)
  - `PORTAL_V2_AUTO_REPLY_LEGACY_STAKEHOLDER_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_LEGACY_INVESTOR_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_LEGACY_EMPLOYMENT_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_INVESTMENT_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_PRESS_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_SUBJECT_PREFIX` (default `TSI Intake Confirmation`)
  - `PORTAL_V2_AUTO_REPLY_SIGNATURE` (default `TSI Intake Team`)
- dashboard controls:
  - `PORTAL_V2_DASHBOARD_ENABLED` (`true`/`false`, default `true`)
  - `PORTAL_V2_DASHBOARD_SHEET_NAME` (default `portal_v2_dashboard`)
  - `PORTAL_V2_TAB_COLOR_NEW` (default `#b71c1c`)
  - `PORTAL_V2_TAB_COLOR_REVIEWED` (default empty/clear)

Then update endpoint in `js/portal-intake-v2.js` (`PORTAL_V2_ENDPOINT`) or set per-form `data-endpoint`.
For full cutover to unified V2, also update `FORM_ENDPOINT` in `js/main.js` to the same V2 `/exec`.

## Dashboard behavior (V2 only)
- V2 writes submissions by route and updates a dashboard tab with:
  - `route`
  - `sheet_name`
  - `unreviewed_count`
  - `status` (`NEW`/`REVIEWED`)
  - `last_submission_utc`
  - `last_submission_id`
  - `last_reviewed_utc`
  - `current_last_row`
- On each new V2 submission, the target route tab is colored using `PORTAL_V2_TAB_COLOR_NEW`.
- To clear route/new state after review, run:
  - `portalV2MarkRouteReviewed('<route>')`
    supported values: `legacy_stakeholder`, `legacy_investor`, `legacy_employment`, `portal_investment`, `portal_press`, `portal_employment`, `portal_internship`
  - `portalV2MarkAllReviewed()`

This is additive to V1: it does not require edits to `form-backend/apps_script_webapp.js`.

## Attachment support notes
- Attachment columns are already in both schemas (`attachment_name`, `attachment_type`, `attachment_size`, `attachment_url`, `attachment_status`).
- Legacy intake already supports attachments for routes where the UI exposes file input.
- Portal pages already include file inputs (`investment`, `press`, `employment` optional; `internship` required).
