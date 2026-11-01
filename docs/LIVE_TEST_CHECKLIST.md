# AI Dungeon live-test checklist

Automated tests can validate JavaScript behavior, but they cannot fully reproduce Latitude's live AI Dungeon runtime. Run this checklist before publishing a release that changes hooks, Story Cards, or model-call coordination.

## Clean installation

- [ ] Create or duplicate a test scenario/adventure.
- [ ] Install all four files from `SAL-only/`.
- [ ] Confirm no duplicate modifier wrappers remain.
- [ ] Confirm `SAL Settings` appears.
- [ ] Confirm `Current Story Arc` appears.
- [ ] Enter `/sal status`; confirm the displayed version is v1.3.11.

## SAL-only behavior

- [ ] Play a normal turn; story prose remains visible.
- [ ] Confirm the SAL story-turn counter advances.
- [ ] Use `/sal redo`; confirm the next private planning call is captured instead of shown as story prose.
- [ ] Confirm a successful result writes 5–8 possibilities to `Current Story Arc`.
- [ ] Type a real action while SAL planning is queued; confirm the action runs and SAL defers.
- [ ] On a later Continue-like turn, confirm deferred SAL planning can run.
- [ ] Set `enabled = false` while planning is queued; confirm the queued planning no longer runs.
- [ ] Re-enable SAL and confirm ordinary play resumes.
- [ ] Manually edit `Current Story Arc`; confirm the non-empty edit is adopted.

## Combined Inner Self + SAL

- [ ] Replace all four tabs with the files from `src/`.
- [ ] Configure at least one Inner Self NPC.
- [ ] Trigger a normal Inner Self thought + story turn.
- [ ] Confirm story prose remains visible.
- [ ] Confirm SAL's turn counter advances after that narrative output.
- [ ] Confirm SAL guidance can still be present during ordinary Inner Self narrative turns.
- [ ] Type a direct question to the configured NPC; confirm their memory can update and they immediately answer the question with SAL enabled.
- [ ] Run `/sal redo`; confirm SAL's private planning does not become an Inner Self task.
- [ ] Confirm `/sal redo` and `/sal status` do not alter an NPC brain card.

## Combined Auto-Cards protection

- [ ] Enable Auto-Cards through Inner Self.
- [ ] Let Auto-Cards become eligible for private work.
- [ ] Type a real player action on a turn where background work could run.
- [ ] Confirm the typed action is not replaced by an Auto-Cards generation message/context.
- [ ] Use a later Continue-like turn and confirm postponed Auto-Cards work can proceed.
- [ ] Confirm normal Auto-Cards card creation still completes.

## Commands/recovery

- [ ] `/sal` works.
- [ ] `/sal help` works.
- [ ] `/sal stop` cancels pending/deferred planning.
- [ ] Replacing all four tabs with the same package recovers cleanly without deleting existing SAL cards.

## Additional regression checks

- [ ] Disable SAL across a scheduled item-removal turn; confirm the arc stays unchanged.
- [ ] Confirm a thought-only response does not advance SAL's story counter.
- [ ] Confirm `/sal stop` does not immediately requeue planning on the next narrative output.
- [ ] Use an ordinary Continue and verify queued/deferred planning resumes.
- [ ] With Auto-Cards enabled, confirm explicit `/ac` commands still work and disabling it stays respected.
- [ ] Verify Memories survive both context cleanup and a compression result containing colons.
- [ ] Reload after generation and a manual arc edit; confirm state and visible cards persist.
- [ ] Try Retry, Undo/erase, and interrupted generations; note any counter/card drift.
- [ ] Inspect long-context behavior and model compliance with conflicting player choices.
- [ ] Inspect Context: optional SAL guidance precedes Recent Story and the newest action, with one Recent Story heading after trimming.
- [ ] Confirm compact SAL notices disappear from later story context.
- [ ] Generate a five-item arc; confirm its first removal occurs seven story turns after saving with default settings.
- [ ] Upgrade a v1.3.10 adventure; confirm its saved arc, next refresh date, NPC brains, and pacing continue without a reset.
- [ ] Check actual hook resource usage, especially combined-package NPC counts, against the documented 16 MB / 2-second limits.

## Record before release

Record the AI Dungeon client/runtime date, model used for the test, package tested, and any behavior that differs from the automated harness. Runtime behavior can change independently of this repository.
