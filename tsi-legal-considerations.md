# TSI Legal Considerations (Placeholder Links)

## Linked Documents
- `privacy.html` (Privacy Policy)
- `terms.html` (Terms of Use)
- `accessibility.html` (Accessibility Statement)
- `security.html` (Security Notice)

## Placement
- Form disclaimer: links to Privacy Policy and Terms of Use.
- Site footer: links to Privacy, Terms, Accessibility, and Security.

## Notes
- These files do not exist yet. Provide the drafted content and we will add them to the site.
- Current data flow uses Google Apps Script + Google Sheets for form submissions. This should be disclosed as a third-party processor in the Privacy Policy.
- The form already includes a short legal notice (Privacy + Terms). Once the legal pages exist, mark "Form Consent Notice" as complete.




# Texas Skills Initiative - Website Launch Checklist

Last reviewed: February 12, 2026  
Scope: current public site and stakeholder inquiry form.

Status key:  
`Needed` = should be completed before launch  
`Conditional` = only if the condition applies  
`N/A` = does not apply right now  
Action key:  
`Generate` = new policy/page/document text  
`Add` = add to site UI, footer, or new file  
`Configure` = technical/ops control  
`Disclose` = short public statement or notice

---

## 1. Legal & Compliance
- [ ] Privacy Policy — Needed — Generate + Add (policy page and footer link; disclose collection, use, storage, retention, third-party processors like Google Apps Script/Sheets, and a contact method for privacy requests).
- [ ] Terms of Use — Needed/Recommended — Generate + Add (policy page and footer link; protects IP, limits liability, sets governing law).
- [ ] Accessibility Statement — Needed if public entity or federally funded; otherwise strongly recommended — Generate + Add (policy page and footer link).
- [ ] Cookie Consent — Conditional — Add (banner only if non-essential cookies/analytics/marketing tags are used; current site appears to avoid non-essential cookies).
- [ ] Copyright Notice — Partially complete — Add (footer already has © 2026 TEXAS SKILLS INITIATIVE; add "All rights reserved." and link to legal page).

## 2. Disclaimers
- [ ] General Information Disclaimer — Recommended — Generate + Add (short disclaimer on legal page; content is informational, not legal/professional advice).
- [ ] External Links Disclaimer — N/A until outbound links are added; Needed once external links exist — Generate + Add (legal page).

## 3. Organizational Transparency
- [ ] Contact Information — Optional/Recommended — Add (a contact method is typically required inside the Privacy Policy for data rights requests; if you do not want public contact on the site, include a privacy-only email inside the Privacy Policy).
- [ ] Entity Status — Needed once legal form is established — Disclose (e.g., nonprofit / 501(c)(3)); if pending, state "Entity formation in progress."
- [ ] Funding & Partnerships — Conditional — Disclose (grants/partners when applicable; otherwise state none).

## 4. Technical & Brand Assets
- [ ] Favicon — Needed — Add (icon file + `<head>` link).
- [ ] Custom 404 Page — Needed — Add (branded recovery page).
- [ ] Sitemap — Needed — Add (XML sitemap for indexing).

## 5. Additional Considerations (Add to Policies/UX)
- [ ] Data Processing & Vendors — Needed — Disclose (list hosting provider, form processor, analytics providers; link to their policies).
- [ ] Data Retention & Deletion — Needed — Generate + Disclose (retention period and how to request deletion).
- [ ] Form Consent Notice — Partially complete — Add (short notice near submit describing data collected and use; Privacy + Terms links already added, finalize once policies are published).
- [ ] Security Controls — Needed — Configure + Disclose (HTTPS, restricted access to form backend/sheets, least-privilege accounts).
- [ ] Policy Versioning — Recommended — Generate (effective date and revision history).
- [ ] Children's Privacy (COPPA) — Conditional — Disclose (only if site targets under 13; otherwise state not directed to children).
- [ ] Email Compliance (CAN-SPAM) — Conditional — Configure + Disclose (only if marketing emails are sent; include unsubscribe).
- [ ] Accessibility Testing — Recommended — Configure + Add (basic audit and contact channel for accessibility issues).
- [ ] International Data Transfers — Conditional — Disclose (if collecting data from outside the US, note that data may be processed/stored in the US; EU/UK GDPR transfer rules apply only if you target those regions).
- [ ] Image/Brand Rights — Needed — Confirm (licenses and model releases for staff photos/assets).

---

**Note on Styling:** Per the CSS baseline, legal and long-form text pages should utilize the light background variable (`#f1f5f9`) for maximum readability. Links to these documents should be placed in the footer near the theme toggle.
