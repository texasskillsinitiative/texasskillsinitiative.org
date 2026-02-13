# 🌑 021026_OVERNIGHT_RUN.md
**Status:** Ready for CLI Autonomous Execution (--yolo)
**Base Anchor:** 021026_master (sourced from ui-tabs-overhaul)
**Naming Convention:** All new files and major logic blocks must use the `021026_` prefix.

---

## 🏗 Setup Phase (Pre-Run)
- Ensure workspace is on `021026_master`.
- Ensure directory `assets/hr/` exists for placeholder placement.

---

## 🛠 Branch 1: `021026_form-logic`
**Objective:** Implement the "Digital Concierge" intake and dynamic tiered responses.

### 1. The "Digital Concierge" Grid
- Replace the current form entry with a 2x3 grid of professional buttons.
- **Button Titles:**
    1. Regional & Government Authority
    2. Educational Leadership & Instruction
    3. Private Sector & Industry Leadership
    4. Small Business & Local Commerce
    5. Professional & Technical Perspective
    6. Student & Community Perspective
- **Functionality:** Clicking a button toggles visibility of relevant form fields for that specific track.

### 2. Tier-Based Mapping & Success Messages
- **Hidden Mapping:** Map a hidden field `handler_tier` to the submission.
    - **Tier 1:** (Gov, Education, Private Sector, Small Business)
    - **Tier 2:** (Professional, Student)
- **Success Tone (Tier 1):** > "Thank you for reaching out. We recognize the importance of your perspective. Your information has been shared with our team for review, and we will follow up with you directly to discuss how your experience aligns with our regional work."
- **Success Tone (Tier 2):** > "Thank you for sharing your perspective. Your input has been received and added to our regional review to help inform our understanding of local conditions. We value these insights as we continue our exploratory work in the area."

### 3. Hold-to-Clear Button
- **Requirement:** A button to clear all form data.
- **Interaction:** User must hold the button for **2 seconds**.
- **Visual:** A left-to-right CSS color-fill animation must "fill" the button during the hold. Reset on release.

---

## 🛠 Branch 2: `021026_ui-staff-gateway`
**Objective:** Expand "TSI Internal" with the Staff Gateway, placeholders, and VPN gate.

### 1. New "About Staff" Content
- **Hierarchy:** Expand the existing "TSI Internal" top-nav button logic.
- **Navigation:** Create a new page/tab titled **"021026_Staff_Gateway"**. Match the layout, navigation, and logistical operation of the "Overview" and "Mandate" pages.
- **Foundational Text:** Insert the "Statement from the Founder" (Michael Steiner’s letter).
- **Placeholder Generation:** Create two 400x400 neutral gray PNGs in `assets/hr/` named `021026_elena.png` and `021026_lisa.png`.
- **Role Display:** Render circular-framed profiles for Elena (Regional Engagement) and Lisa (Operations).
- **HR Disclaimer:** Include at the footer of the staff section: *"TSI operates with a lean core... Roles shown reflect areas of responsibility and communication, not current staffing levels."*

### 2. Remote Node Access (VPN Gate)
- **Gate UI:** Add a secondary button within the "TSI Internal" ecosystem for "Remote Node Access."
- **Page Name:** `tsi_internal.html`
- **Visuals:** A professional, dark-themed SSO login box. Include status text like "Node Status: Encrypted" or "Secure Connection Established."
- **Behavior:** Any credential attempt must return a "Standard Failure" message (e.g., "Unauthorized Node" or "Invalid Credentials").

### 3. Global CSS Refinements
- **Scroll Bar:** Style the form scrollbar to match the `#0b1220` dark theme. It must not visually overlap or interfere with the text input boundaries.
- **Bottom Bar:** Standardize the footer/bottom bar height to a fixed **40px** across all views.

---

## 🏁 Execution Guardrails (CLI Instruction)
1. **Serial Execution:** Complete Branch 1, commit, reset to master, then complete Branch 2.
2. **Isolation:** Branch 2 must NOT contain any changes made in Branch 1.
3. **No Merging:** Codex is strictly forbidden from merging these branches into master.
4. **Context Check:** All interaction must adhere to the "Phase 0" exploratory posture.
