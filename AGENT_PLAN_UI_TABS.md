# UI Tabs Overhaul – Agent Execution Plan

## Objective
Convert the current single-page, long-scroll HTML site into a **tab-style interface** with **minimal JavaScript reliance**, while preserving reliability for school, government, and international users. The site is hosted on **GitHub Pages** and must remain fully functional without JavaScript for core content navigation.

This work should be completed end-to-end by a single agent in a **sandboxed branch**, without impacting the live site.

---

## Working Rules (Critical)
- **Work only on a dedicated branch** (e.g. `ui-tabs-overhaul`)
- **Do not touch `main`**
- **Do not add frameworks, build tools, or dependencies**
- **Do not fetch content via JavaScript at runtime**
- **Do not substantially rewrite copy unless required for layout**
- **Preserve existing section IDs and anchor links**
- **Maintain GitHub Pages compatibility**

---

## Current Site Characteristics
- Single `index.html`
- Inline CSS and inline JavaScript
- Anchor-based navigation (`#overview`, `#mandate`, `#pipeline`, `#rubric`, `#engagement`)
- External form submission module (JS-dependent)
- Existing modals, animations, and interaction scripts

---

## Target Architecture (Post-Change)
- `index.html`: structure + content only

- `main.css`: all styling, including tab behavior

- `main.js`: progressive enhancements only (not required for core navigation)



---



## Functional Requirements



### Tabs Behavior (Low-JS / No-JS Core)

- Use **URL hash navigation** (`#section-id`) as the state mechanism

- Implement tab-like behavior using **CSS `:target`**

- Only the active section should be visible at a time

- When JavaScript is disabled:

  - Anchor navigation still works

  - Content remains readable

  - At least one section (Overview) is visible by default



### Accessibility & Reliability

- Navigation must work with keyboard only

- Clear visual indication of active tab

- No blank screens if JS fails

- Forms may require JS, but content must not



---



## Tasks



### 1. Branch Setup

- Create and work on branch: `ui-tabs-overhaul`

- Leave `main` untouched



---



### 2. Extract CSS

- Move **all inline CSS** from `index.html` into `/css/main.css`

- Link stylesheet from `index.html`

- Do not introduce breaking selector changes unless required



---



### 3. Extract JavaScript

- Move **all inline JS** into `/js/main.js`

- Link script from `index.html`

- Preserve existing behavior:

  - modals

  - animations

  - form submission logic

- JS must **not** be required for basic navigation or content visibility



---



### 4. Implement Tab Layout (CSS-first)

- Convert long-scroll sections into tab panels:

  - Hide all panels by default

  - Show the `:target` panel

  - Default to `#overview` when no hash is present

- Maintain existing section IDs exactly

- Do not rely on JS to render or load content



---



### 5. Navigation Styling

- Style the navigation bar to visually behave like tabs

- Highlight the active tab:

  - Prefer CSS-only solution

  - Optional minimal JS enhancement allowed (non-critical)



---



### 6. Verify Form & Modal Functionality

- Ensure form submission still works

- Ensure modals still open/close correctly

- If the form requires JS, confirm graceful failure messaging remains in place



---



### 7. Testing Requirements



#### Manual Testing

- Load site with JavaScript enabled

- Load site with JavaScript disabled

- Navigate directly to:

  - `/index.html`

  - `/index.html#pipeline`

  - `/index.html#engagement`



#### Expected Results

- Content is visible in all cases

- Tabs switch correctly

- No console errors

- No blank states



---



## Out of Scope (Explicitly Do Not Do)

- Do not add runtime HTML partial loading

- Do not add build pipelines

- Do not restructure assets

- Do not rename IDs or anchors

- Do not introduce analytics or third-party scripts



---



## Final Deliverables

At completion, provide:



1. **Summary of changes**

2. **List of files modified**

3. **How to test locally**

4. **Known limitations or follow-up recommendations**



---



## Design Philosophy

This site targets:

- schools and districts

- administrators

- NGOs and international partners



Assume:

- conservative IT environments

- partial JS blocking

- older browsers and networks



Core content visibility must **never** depend on JavaScript.



---