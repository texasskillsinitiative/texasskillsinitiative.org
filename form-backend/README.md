## Form Backend Setup

This Apps Script backend is intentionally committed without live identifiers.

### Required configuration
Set these in **Apps Script > Project Settings > Script properties**:

- `SPREADSHEET_ID` (required)

Optional overrides:

- `SHEET_NAME` (default: `responses`)
- `HONEYPOT_KEY` (default: `website`)
- `HONEYPOT_SHEET_NAME` (default: `honeypot`)
- `RATE_LIMIT_SECONDS` (default: `60`)
- `MESSAGE_MAX_LENGTH` (default: `1000`)
- `SOURCE` (default: `tsi-site`)
- `ADMIN_EMAIL` (default: empty / disabled)
- `AUTO_REPLY_FROM_EMAIL` (default: empty)

### clasp setup
`form-backend/.clasp.json` uses a placeholder `scriptId`.
Before push/pull/deploy, replace `REPLACE_WITH_SCRIPT_ID` with your local script ID.

