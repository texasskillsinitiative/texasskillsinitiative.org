# Autonomous Mode Operating Contract (Draft)

This file defines recommended autonomous behavior for this repository.

`Inactive by default`: Do not enforce this policy unless the user explicitly says to activate it for a session.

## 1) Source Of Truth
- `STATUS.md` is the primary roadmap and progress tracker for this repository.
- `AGENTS-LOG.md` is the running session log for actions, troubleshooting notes, and resolutions.
- `PACKETS.md` defines concurrent work boundaries to prevent overlap/cross-contamination.
- Do not infer scope from deleted or legacy docs.

## 2) Scope Discipline
1. Execute requested work in order, one active packet at a time.
2. Keep edits isolated to files directly related to the active packet.
3. Do not add out-of-scope features unless explicitly requested.
4. Prefer targeted edits over broad redesign.

## 3) Execution Behavior
1. Work end-to-end autonomously unless blocked by:
   - destructive actions the user did not request
   - a product decision that is ambiguous and materially affects outcome
   - missing credentials, secrets, or access
2. Prefer reliable minimal implementations over speculative expansion.
3. Restate assumptions when task details are ambiguous.

## 4) Planning Restrictions
- Do not create or change milestones independently.
- Follow approved scope in `STATUS.md` and any active user instruction.
- Ask before adding new plan items to tracked docs.
- Suggestions are allowed, but scope changes require approval.

## 5) Status Alignment
1. Before coding, state the target item and intended files.
2. After coding, update `STATUS.md` for any material progress or status change.
3. Any completed claim should have repo-verifiable evidence (diff, test output, or commit).

## 6) Safety And Change Hygiene
1. Do not include unrelated files in commits.
2. Do not modify operator/local data artifacts unless requested.
3. Do not remove docs/policies without a replacement in the same change.
4. Avoid destructive git actions unless explicitly requested.
5. Keep workstreams separate (for example, do not mix map/pipeline edits with legal/docs updates in one commit).
6. If site structure or ownership boundaries change (new sections, renamed files, moved logic), update `PACKETS.md` in the same work packet.

## 7) Verification Standard
1. Run the smallest relevant verification for the edited area.
2. For this static site, prefer:
   - section smoke checks (`#overview`, `#pipeline`, `#engagement`, `#team`)
   - browser console error check
   - responsive checks at key breakpoints (`900px`, `600px`)
   - interaction checks for modals/tabs/forms when touched
3. If full verification is not run, report what was and was not validated.
4. Report concrete risks/regressions if any remain.

## 8) Commit And Reporting Policy
- Use clear commit messages scoped to the task.
- Commit only when requested or when a workflow explicitly requires commit checkpoints.
- Push only when explicitly requested.
- After each completed packet, report:
  - changed files
  - verification run
  - commit hash (if committed)
  - push result (if pushed)

## 9) Work Cycle
1. Confirm target outcome and constraints.
2. Implement focused changes.
3. Run relevant verification.
4. Update `STATUS.md` and any task-relevant checklist docs.
5. If the change affects parallel-work boundaries, update `PACKETS.md` before finishing.
6. Summarize results and remaining risks.
7. Continue to next requested packet without expanding scope.

## 10) Agent Log Requirements (`AGENTS-LOG.md`)
1. Keep a brief running log during the session and update it periodically (start, major action/change, troubleshooting event, and before close).
2. Each log entry must include:
   - time
   - agent name
   - agent version
   - actions taken
   - troubleshooting suggestions
   - resolutions/outcomes
3. `AGENTS-LOG.md` is additive/append-oriented:
   - do not delete prior entries
   - do not remove content from other agents
   - only revise your own current live entry while it is still in progress
4. Use this required tail marker as the final line of the file while a session is active:
   - `[AGENTS-LOG-TAIL] ACTIVE_SESSION_UNTIL_CLEAN_CLOSE`
5. Normal log edits must be written above the tail marker line.
6. After a work packet completes, append a short final entry for that packet above the tail marker.

## 11) Session Close Protocol
If the user requests to close/end the session, perform this sequence before exiting:
1. Append a final entry to `AGENTS-LOG.md` with:
   - time
   - agent name
   - agent version
   - actions taken
   - troubleshooting suggestions
   - resolutions/outcomes
   - commit hash(es) if any
2. Update `STATUS.md` to reflect final `Done`/`Planned`/`Blocked` state for affected items.
3. Update `PACKETS.md` only if packet boundaries/ownership logic changed in this session.
4. Run a final repository check:
   - `git status`
   - `git log --oneline -n 3`
5. If commit/push was requested, ensure it is complete and report:
   - changed files
   - final commit hash
   - push result
6. Provide a short handoff summary:
   - completed work
   - remaining work
   - risks/blockers
   - recommended next step
7. Replace the active tail marker line with planned exit log entries and closure details (do not leave active marker at EOF after clean close).

## 12) Unexpected Exit Detection + Clean Restart
1. On session start, check the last line of `AGENTS-LOG.md`.
2. If the last line is:
   - `[AGENTS-LOG-TAIL] ACTIVE_SESSION_UNTIL_CLEAN_CLOSE`
   then treat prior session as unexpectedly closed.
3. In that case, append a recovery note above the marker including:
   - detection time
   - agent name
   - agent version
   - observed unclean-exit condition
4. Suggest clean restart options to the user:
   - Option 1: Continue from current working tree and resume from latest `STATUS.md` item.
   - Option 2: Review `git status` + recent commits first, then resume.
   - Option 3: Reset to a known-good commit and restart the packet.
5. Keep exactly one active tail marker line at EOF during an active session.
