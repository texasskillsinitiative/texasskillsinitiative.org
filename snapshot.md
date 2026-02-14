**Snapshot Export (Internal Use Only)**
Keep snapshot artifacts private. Do not publish or commit the `snapshot/` folder.

**Quick Use**
1. Generate PDFs into `snapshot/` (or a subfolder).
2. Name the export folder by commit + timestamp.
3. Verify dynamic states (tabs, modals, team panels) are captured.

---

**Purpose**
This document describes the internal-only snapshot workflow for generating PDF exports of site pages and dynamic states for review and archiving.

**Privacy / Distribution**
- The `snapshot/` folder must remain internal and should never be published to GitHub or shared externally.
- Ensure `snapshot/` is excluded in `.gitignore`.

**Naming Convention**
Use a folder per export run, named with the last commit and timestamp:

```
snapshot/
  2e78b8b_2026-02-13_19-30-00/
    index-overview.pdf
    index-mandate.pdf
    ...
```

Format: `{shortCommit}_{YYYY-MM-DD_HH-MM-SS}` (local time).

**Export Structure**
- If exporting multiple files, create a new subfolder inside `snapshot/` for each run.
- Each PDF should be named by page/section/state.

Recommended filenames:
- `index-overview.pdf`
- `index-mandate.pdf`
- `index-rubric.pdf`
- `index-pipeline.pdf`
- `index-engagement.pdf`
- `index-team-founder.pdf`
- `index-team-community.pdf`
- `index-team-operations.pdf`
- `index-access-modal.pdf`
- `index-portal-modal.pdf`
- `privacy.pdf`
- `terms.pdf`
- `security.pdf`
- `accessibility.pdf`
- `404.pdf`
- `tsi_internal.pdf`

**Dynamic States to Capture**
For the main site, capture:
- Overview splash (after animation completes).
- Each primary tab/section.
- Team tab panels (Founder, Community, Operations).
- Access modal (concierge form).
- Portal modal (internal login).

**Operational Notes**
- Use a headless browser with PDF export support.
- Wait for animations and dynamic content to settle before capturing.
- If a state is time-based, ensure the capture waits for the final visible state.

