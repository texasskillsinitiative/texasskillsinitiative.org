# Temporary Setup Tasks (Priority Order)

## P0 - Must Do Before Launch

1. Configure script properties in Apps Script
- `SPREADSHEET_ID`
- `INVESTOR_SPREADSHEET_ID` (optional; falls back to `SPREADSHEET_ID`)
- `EMPLOYMENT_SPREADSHEET_ID` (optional; falls back to `SPREADSHEET_ID`)
- `SHEET_NAME`, `INVESTOR_SHEET_NAME`, `EMPLOYMENT_SHEET_NAME` (optional)
- `UPLOAD_DRIVE_FOLDER_ID` (recommended)
- `FILE_UPLOAD_MAX_BYTES` (default `8388608` / 8MB)

2. Confirm permissions for the deploy account
- Must have write access to target spreadsheet(s)
- Must have write access to `UPLOAD_DRIVE_FOLDER_ID` (or Drive root if omitted)

3. Deploy/redeploy the Apps Script web app
- Publish latest backend changes
- Ensure deployment is authorized under the intended owner account

4. Confirm frontend endpoint
- Verify `FORM_ENDPOINT` in `js/main.js` matches current deployed Apps Script URL

## P1 - Launch Validation

5. Validate routing and logging
- Stakeholder submissions -> `responses` (or `SHEET_NAME`)
- Investor submissions -> `investor_responses` (or `INVESTOR_SHEET_NAME`)
- Employment submissions -> `employment_responses` (or `EMPLOYMENT_SHEET_NAME`)

6. Run end-to-end submission checks
- Submit stakeholder form (no attachment)
- Submit investor form (with attachment)
- Submit employment form (with attachment)
- Verify each row lands in the correct target sheet

7. Validate attachment behavior
- Verify metadata columns are populated:
  - `attachment_name`
  - `attachment_type`
  - `attachment_size`
  - `attachment_url`
  - `attachment_status`
- Confirm uploaded files are visible to intended internal reviewers

## P2 - Hardening (Recommended)

8. Run abuse/error checks
- Honeypot still blocks bot-like payloads
- Rate limiting still behaves as expected
- Invalid extension is rejected
- Oversized upload is rejected cleanly

9. Decide data-separation level
- Keep one spreadsheet with separate sheets, or
- Split investor/employment into separate spreadsheets for stronger isolation

10. Apply Drive sharing policy
- Restrict folder/file visibility to internal staff only
