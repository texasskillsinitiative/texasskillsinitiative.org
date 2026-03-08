# Portal V3 Integration Notes

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

## Unified compatibility mode (V3 endpoint replacing production path)
This backend supports:
- six canonical stakeholder routes behind the existing stakeholder UX (from `js/main.js`):
  - `government`
  - `education`
  - `private-sector`
  - `small-business`
  - `professional`
  - `student`
- investment, press, employment, internship routes (from `js/portal-intake-v2.js`)

Legacy backend files are retained in-repo for reference only; the active launch candidate is the V3-configured backend in this repo.

## Current V3 workbook layout
- Canonical all-forms ledger:
  - `ALLF`
- Route tabs:
  - `SGOV`, `SEDU`, `SPVT`, `SSML`, `SPRO`, `SSTU`, `PINV`, `PPRS`, `PEMP`, `PINT`
- Support tabs:
  - `ABUS`, `MAIL`, `BRST`, `IUSR`, `WRIT`, `DASH`

## Current V3 code-configured sources
- Script ID:
  - `1M-f5amNTPSb4RZ21gBON0tC6-8pwQMCp0G9G4rx42xBMky1gcX9FtPDy`
- Database workbook:
  - `1hxIaJqfa5O_3vxPNChdfltPkGhsoGpJJiC00ojgV_6c`
- Template source workbook/tab:
  - `1X70S4LbfR3ufqLo9sOQEa582sn72uoGJ35ezXpCIrTQ`
  - `live_edit`

## Notes
- Employment page intentionally accepts applications regardless of active openings.
- Internship page is structured as a fuller application and requires resume upload.
- Investment page is positioned as inquiry-oriented rather than job-application style.
- Unified schema includes stakeholder-only fields (`focus`, `loc_state`).
- For fields not shown on a given form, the backend writes `field_not_visible`.
- For fields shown but left blank, the backend writes `user_no_response`.
- Stakeholder validation requires at least one locality field: `loc_city` or `loc_state`.
- Press validation requires timeline intent: either `pprs_deadline` or `press_deadline_mode = no_deadline`.
- Abuse throttling (global, per-track, per-email, duplicate submission IDs) is enforced in the backend and logged to the honeypot sheet.
- Honeypot-triggered requests still return a generic success response. Legitimate-user-affecting blocks now return neutral soft errors (`already_received`, `retry_later`, `temporarily_unavailable`) so the frontend can avoid false success states.
- Every accepted submission now writes to the canonical `ALLF` ledger first, then mirrors to its route tab.
- Mirror write failures are retained in `WRIT`; the canonical `ALLF` row remains the source of truth.
- Internal username logging now requires only `internal_event=tsi_username_capture` plus `tsi_username`.
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

No database or template source properties are required in the current V3 setup; those are configured in code.

Optional script properties:
- `PORTAL_V2_ZEPTO_TOKEN`

Runtime defaults now live at the top of `form-backend/portal_v2_config.js`.
Edit there for:
- workbook IDs
- template source IDs/tab
- sheet names
- honeypot/internal sheet names
- rate limits / dedupe / message limits / file limit
- admin notify email
- sender address and optional route-specific sender overrides
- auto-reply master/default behavior
- source tags and internal-domain allowlist

Current V3 canonical intake columns:
- `received_utc`
- `client_tz`
- `client_utc_offset_minutes`
- `rout`
- `name`, `email`, `org`, `role`, `loc_city`, `loc_state`, `loc_country`, `focus`, `message`
- `pinv_stage`, `pinv_check_range`, `pinv_geography`, `pinv_focus`, `pinv_timeline`, `pinv_investor_type`, `pinv_investor_type_other`
- `pprs_outlet`, `pprs_role`, `pprs_deadline`, `pprs_topic`, `pprs_format`
- `pemp_role_interest`, `pemp_timeline`, `pemp_location_pref`
- `pint_school`, `pint_program`, `pint_grad_date`, `pint_track`, `pint_mode`, `pint_hours_per_week`, `pint_start_date`, `pint_portfolio_url`
- `attachment_name`, `attachment_type`, `attachment_size`, `attachment_url`, `attachment_status`
- `source`, `page_path`, `referrer`, `submission_id`

Current template token surface:
- route/time: `rout`, `route`, `route_name`, `submission_id`, `received_utc`, `client_tz`, `client_utc_offset_minutes`, `received_local`, `received_texas`
- common fields: `name`, `email`, `org`, `role`, `loc_city`, `loc_state`, `loc_country`, `focus`, `message`, `source`, `page_path`, `referrer`, `submitted_fields_block`
- route-specific fields: `pinv_*`, `pprs_*`, `pemp_*`, `pint_*`
- attachment fields: `attachment_name`, `attachment_type`, `attachment_size`, `attachment_url`, `attachment_status`

Rate-limit tuning (consumer defaults from `PORTAL_V2_RUNTIME_DEFAULTS.LIMITS`):

| Runtime field | Suggested (low traffic) | Higher (burst-tolerant) | Hard Upper Limit (consumer-safe) |
| --- | ---: | ---: | ---: |
| `RATE_LIMIT_GLOBAL_MAX` | 3 | 6 | 12 |
| `RATE_LIMIT_TRACK_MAX` | 2 | 3 | 6 |
| `RATE_LIMIT_SECONDS` (per-email cooldown) | 45 | 30 | 15 |

Notes:
- The “hard upper” column is a practical cap; these are throttles, not Google quotas.
- If legit users get blocked, move one column to the right. If bots slip through, move one column to the left.

ZeptoMail notes:
- When `PORTAL_V2_ZEPTO_TOKEN` is set, admin notifications and auto-replies send via ZeptoMail.
- Default mail behavior is global sender mode: all routes use `PORTAL_V2_RUNTIME_DEFAULTS.MAIL.ZEPTO_FROM_DEFAULT`.
- Route-specific sender overrides are optional and only apply when `PORTAL_V2_RUNTIME_DEFAULTS.MAIL.ZEPTO_USE_ROUTE_FROM = true`.
- Set `PORTAL_V2_RUNTIME_DEFAULTS.MAIL.ZEPTO_FROM_DEFAULT` to a verified sender address in ZeptoMail (for example `howdy@texasskillsinitiative.org`).
- All mail events are logged to `MAIL`.
- Fallback sends prepend `[FALLBACK]` to the subject and are logged.
- Auto-reply requires `PORTAL_V2_RUNTIME_DEFAULTS.MAIL.AUTO_REPLY_ENABLED = true`.
- Auto-reply master behavior: when the master flag is true, auto-reply is ON for all routes unless a route override is explicitly set to `false`.
- Use `portalV2ZeptoDebugSend()` to capture detailed ZeptoMail response headers in `portal_v2_mail_log` if you hit `http_500` with no body.
- Use `portalV2SenderDebug()` or `portalV2RuntimeConfigDebug()` to inspect the effective runtime config from the Apps Script editor.

Then update endpoint in `js/portal-intake-v2.js` (`PORTAL_V2_ENDPOINT`) or set per-form `data-endpoint`.
For full cutover to unified V2, also update `FORM_ENDPOINT` in `js/main.js` to the same V2 `/exec`.

To create the V3 workbook structure, run:
- `portalV2InitializeSheets()`

To archive and reset managed sheets, run:
- `portalV2ResetSheets()`

`portalV2ResetSheets()` now:
- creates a new standalone archive spreadsheet
- copies all managed intake/support tabs into that archive
- clears only managed live tabs back to headers
- preserves nonmanaged/user-created tabs in the live workbook

To repair missing route mirrors from the canonical ledger, run:
- `portalV2ReconcileRouteMirrors()`

This is additive to V1: it does not require edits to `form-backend/apps_script_webapp.js`.

## Attachment support notes
- Attachment columns are already in both schemas (`attachment_name`, `attachment_type`, `attachment_size`, `attachment_url`, `attachment_status`).
- Legacy intake already supports attachments for routes where the UI exposes file input.
- Portal pages already include file inputs (`investment`, `press`, `employment` optional; `internship` required).
