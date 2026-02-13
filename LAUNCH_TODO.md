# TSI Site Launch Master To-Do
Last updated: February 12, 2026
Target: done by morning; ready to test and launch by lunch.

Status key:
`Now` = must finish by morning
`Before Launch` = must finish before lunch launch
`Conditional` = only if applicable

---

## Content & UX (Now)
- [ ] Replace the draft founder letter with final approved text in `index.html` (section: "Statement from the Founder").
- [ ] Confirm staff names/roles and headshots are final (assets in `assets/hr/`).

## Legal, Policy, and Compliance (Now)
- [x] Privacy Policy: set a concrete data-retention period (24 months) and deletion request process.
- [x] Privacy Policy: clarify that the site hosts static informational content and that only form submissions are stored in Google Drive/Sheets via Google Apps Script.
- [x] Privacy Policy: add hosting provider disclosure (GitHub Pages).
- [ ] Terms: confirm final entity status and any required disclosures.
- [x] Footer: add "All rights reserved." alongside the © notice.
- [ ] Funding/partnerships: add a disclosure if applicable, or state none.
- [ ] Security controls: verify HTTPS enforcement and least-privilege access to Google Apps Script/Sheets.
- [ ] Image/brand rights: confirm licenses and model releases for staff photos and assets.
- [ ] Cookie consent: add a banner only if non-essential cookies/analytics/marketing tags are introduced. (Conditional)
- [ ] Policy versioning: add a brief revision history section if desired. (Conditional)

## Technical & SEO (Now)
- [x] Add favicon asset + `<link>` tags across `index.html`, `privacy.html`, `terms.html`, `accessibility.html`, `security.html`, and `tsi_internal.html`.
- [x] Add `sitemap.xml` for indexing.
- [x] Add `robots.txt` (confirm indexing rules).
- [x] Add a custom `404.html` page.

## QA & Testing (Before Launch)
- [ ] Stakeholder form: concierge selection, required fields, email validation, 3s time trap, hold-to-clear 2s behavior, and success/error states.
- [ ] Stakeholder form: concierge selection collapse (other buttons hide smoothly after selection).
- [ ] Modal behavior: open/close, outside-click handling, submit lockout, success overlay transitions.
- [ ] Navigation tabs: hash navigation, active states, and focus styles.
- [ ] Theme toggle and logo swap (dark/light).
- [ ] Responsive layout: mobile nav, modal scroll, form layout, and staff grid.
- [ ] Accessibility checks: keyboard navigation, visible focus, contrast, aria labels, and screen-reader order.
- [ ] Link check: verify all internal links and legal links.

## Launch Readiness (Before Launch)
- [ ] Confirm production form endpoint and data capture in Sheets.
- [ ] Snapshot/backup current build prior to launch.
- [ ] Final content review and sign-off.
