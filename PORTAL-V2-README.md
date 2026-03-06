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
This V2 backend supports:
- stakeholder intake routes (from `js/main.js`)
- investment, press, employment, internship routes (from `js/portal-intake-v2.js`)

Legacy backend files are retained in-repo for reference only; production runs the V2 endpoint.

## Notes
- Employment page intentionally accepts applications regardless of active openings.
- Internship page is structured as a fuller application and requires resume upload.
- Investment page is positioned as inquiry-oriented rather than job-application style.
- Unified schema includes stakeholder-only fields (`focus`, `loc_state`).
- For fields not shown on a given form, the backend writes `field_not_visible`.
- For fields shown but left blank, the backend writes `user_no_response`.
- Stakeholder validation requires at least one locality field: `loc_city` or `loc_state`.
- Press validation requires timeline intent: either `press_deadline` or `press_deadline_mode = no_deadline`.
- Abuse throttling (global, per-track, per-email, duplicate submission IDs) is enforced in the backend and logged to the honeypot sheet.
- Honeypot entries include `_honeypot_reason`, `_honeypot_field`, `_honeypot_value`, and `_honeypot_summary` in the payload column.
- Honeypot sheet columns include trigger metadata (`trigger_type`, `trigger_reason`, `trigger_details`) plus email domain, location, attachment presence, and payload bytes for triage.
- Global and per-track burst counters are stored in a dedicated sheet (`portal_v2_burst_state`) using a sliding window for consistency.
- If legitimate users submit within the same window and hit limits, raise the `*_MAX` values or set them to `0` to disable that limiter.
- Debug: send `_debug_burst: "1"` in payload to log current burst counters to honeypot (`trigger_type=debug_burst`). Debug requests do not write to intake sheets.

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
- `PORTAL_V2_DATABASE_ID`

Optional:
- sheet names per route
- stakeholder sheet routing (writes into `PORTAL_V2_DATABASE_ID`):
  - `PORTAL_V2_STAKEHOLDER_SHEET_NAME` (default `responses`)
- per-route upload folder IDs
- shared portal upload folder override (`PORTAL_V2_PORTAL_UPLOAD_FOLDER_ID`)
- stakeholder upload folder override:
  - `PORTAL_V2_STAKEHOLDER_UPLOAD_FOLDER_ID`
- rate limit / max message / max file
- abuse throttles (all optional):
  - `PORTAL_V2_RATE_LIMIT_SECONDS` (default `30`)
  - `PORTAL_V2_RATE_LIMIT_GLOBAL_MAX` (default `6`)
  - `PORTAL_V2_RATE_LIMIT_TRACK_MAX` (default `3`)
  - `PORTAL_V2_DEDUPE_SECONDS` (default `3600`)
  - window seconds are set in code (not properties) in `form-backend/portal_v2_config.js`

Rate-limit tuning (consumer defaults):

| Setting | Suggested (low traffic) | Higher (burst-tolerant) | Hard Upper Limit (consumer-safe) |
| --- | ---: | ---: | ---: |
| `PORTAL_V2_RATE_LIMIT_GLOBAL_MAX` | 3 | 6 | 12 |
| `PORTAL_V2_RATE_LIMIT_GLOBAL_WINDOW_SECONDS` | 10 | 10 | 10 |
| `PORTAL_V2_RATE_LIMIT_TRACK_MAX` | 2 | 3 | 6 |
| `PORTAL_V2_RATE_LIMIT_TRACK_WINDOW_SECONDS` | 10 | 10 | 10 |
| `PORTAL_V2_RATE_LIMIT_SECONDS` (per-email cooldown) | 45 | 30 | 15 |

Notes:
- The “hard upper” column is a practical cap; these are throttles, not Google quotas.
- If legit users get blocked, move one column to the right. If bots slip through, move one column to the left.

ZeptoMail notes:
- When `PORTAL_V2_ZEPTO_TOKEN` + `PORTAL_V2_ZEPTO_AGENT_ALIAS` are set, admin notifications and auto-replies send via ZeptoMail.
- Per-route `PORTAL_V2_ZEPTO_FROM_*` values override the default From address.
- Set `PORTAL_V2_ZEPTO_FROM_DEFAULT` to a verified sender address in ZeptoMail (for example `hello@texasskillsinitiative.com` if that is the verified domain).
- All mail events are logged to `PORTAL_V2_MAIL_LOG_SHEET_NAME`.
- Fallback sends prepend `[FALLBACK]` to the subject and are logged.
- After adding ZeptoMail, the script must be authorized for external requests. Run `portalV2AuthorizeExternalRequest_()` once in the Apps Script editor and approve the prompt, then redeploy.
- Auto-reply requires `PORTAL_V2_AUTO_REPLY_ENABLED = true` and each per-route toggle set to `true`.
- Auto-reply master behavior: when `PORTAL_V2_AUTO_REPLY_ENABLED = true`, auto-reply is ON for all routes unless a per-route toggle is explicitly set to `false`.
- If you see `Error 400: invalid_scope` during authorization, refresh the project after pulling `appsscript.json` updates and retry the auth prompt.
- Use `portalV2ZeptoDebugSend()` to capture detailed ZeptoMail response headers in `portal_v2_mail_log` if you hit `http_500` with no body.
- burst state sheet name (optional):
  - `PORTAL_V2_BURST_SHEET_NAME` (default `portal_v2_burst_state`)
- admin notify email:
  - `PORTAL_V2_ADMIN_NOTIFY_EMAIL` (fallback: `PORTAL_V2_ADMIN_EMAIL`)
- ZeptoMail (optional):
  - `PORTAL_V2_ZEPTO_TOKEN`
  - `PORTAL_V2_ZEPTO_AGENT_ALIAS`
  - `PORTAL_V2_ZEPTO_FROM_DEFAULT` (default `hello@texasskillsinitiative.org`)
  - `PORTAL_V2_ZEPTO_FROM_STAKEHOLDER`
  - `PORTAL_V2_ZEPTO_FROM_INVESTMENT`
  - `PORTAL_V2_ZEPTO_FROM_PRESS`
  - `PORTAL_V2_ZEPTO_FROM_EMPLOYMENT`
  - `PORTAL_V2_ZEPTO_FROM_INTERNSHIP`
  - `PORTAL_V2_ZEPTO_REPLY_TO_DEFAULT` (optional)
  - `PORTAL_V2_ZEPTO_API_BASE` (default `https://api.zeptomail.com`; use `.eu` or `.in` if needed)
  - `PORTAL_V2_MAIL_LOG_SHEET_NAME` (default `portal_v2_mail_log`)
  - `PORTAL_V2_MAIL_FALLBACK_ENABLED` (default `true`)
- auto-reply controls:
  - `PORTAL_V2_AUTO_REPLY_ENABLED` (`true`/`false`, default `false`)
  - `PORTAL_V2_AUTO_REPLY_STAKEHOLDER_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_INVESTMENT_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_PRESS_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_EMPLOYMENT_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_PORTAL_INTERNSHIP_ENABLED`
  - `PORTAL_V2_AUTO_REPLY_SUBJECT_PREFIX` (default `TSI Intake Confirmation`)
  - `PORTAL_V2_AUTO_REPLY_SIGNATURE` (default `TSI Intake Team`)

Then update endpoint in `js/portal-intake-v2.js` (`PORTAL_V2_ENDPOINT`) or set per-form `data-endpoint`.
For full cutover to unified V2, also update `FORM_ENDPOINT` in `js/main.js` to the same V2 `/exec`.

To reset all route sheets (clears contents and writes fresh headers), run:
- `portalV2ResetSheets()`

This is additive to V1: it does not require edits to `form-backend/apps_script_webapp.js`.

## Attachment support notes
- Attachment columns are already in both schemas (`attachment_name`, `attachment_type`, `attachment_size`, `attachment_url`, `attachment_status`).
- Legacy intake already supports attachments for routes where the UI exposes file input.
- Portal pages already include file inputs (`investment`, `press`, `employment` optional; `internship` required).
