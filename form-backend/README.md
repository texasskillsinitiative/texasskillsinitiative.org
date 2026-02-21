## Form Backend Setup

This Apps Script backend is intentionally committed without live identifiers.

### Required configuration
Set these in **Apps Script > Project Settings > Script properties**:

- `SPREADSHEET_ID` (required)

Optional overrides:

- `SHEET_NAME` (default: `responses`)
- `INVESTOR_SPREADSHEET_ID` (default: falls back to `SPREADSHEET_ID`)
- `EMPLOYMENT_SPREADSHEET_ID` (default: falls back to `SPREADSHEET_ID`)
- `INVESTOR_SHEET_NAME` (default: `investor_responses`)
- `EMPLOYMENT_SHEET_NAME` (default: `employment_responses`)
- `HONEYPOT_KEY` (default: `website`)
- `HONEYPOT_SHEET_NAME` (default: `honeypot`)
- `RATE_LIMIT_SECONDS` (default: `60`)
- `MESSAGE_MAX_LENGTH` (default: `1000`)
- `FILE_UPLOAD_MAX_BYTES` (default: `8388608` = 8MB)
- `UPLOAD_DRIVE_FOLDER_ID` (optional; if omitted uploads go to script owner's root Drive)
- `SOURCE` (default: `tsi-site`)
- `ADMIN_EMAIL` (default: empty / disabled)
- `AUTO_REPLY_FROM_EMAIL` (default: empty)

### New intake routes
- `submission_type=stakeholder` -> default stakeholder responses sheet
- `submission_type=investor` -> investor responses sheet/spreadsheet
- `submission_type=employment` -> employment responses sheet/spreadsheet

### File upload payload contract
Frontend sends:
- `attachment_name`
- `attachment_type`
- `attachment_size` (bytes, string/number)
- `attachment_data` (base64 payload without the data URL prefix)

Backend stores uploaded file metadata in the response log and writes `attachment_url`.

### Manual setup required for uploads
1. Deploy this Apps Script as web app (same as existing flow).
2. Ensure the deployment account has Drive write access.
3. If you want uploads in a specific folder, create one in Drive and set `UPLOAD_DRIVE_FOLDER_ID`.
4. If routing to separate investor/employment spreadsheets, set both spreadsheet IDs in script properties.
5. Re-deploy after property changes.

### clasp setup
`form-backend/.clasp.json` uses a placeholder `scriptId`.
Before push/pull/deploy, replace `REPLACE_WITH_SCRIPT_ID` with your local script ID.
