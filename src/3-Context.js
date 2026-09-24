// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON CONTEXT — v1.3.9
// Paste this entire file into the Context tab.
// ============================================================================

if (typeof SAL_state !== "function") {
  throw new Error("SAL Library is missing or incomplete. Replace all four tabs with files from the same SAL package and save.");
}

globalThis.stop ??= false;
const sal = SAL_state();

if (sal.commandPending) {
  // Phoenix has no clean no-model command path: stop:true throws an error and
  // state.message is not implemented. Use one tiny hidden model call, then
  // replace its Output with the command response.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  sal.innerSelfTaskActive = false;
  globalThis.stop = false;
  text = "SAL utility command. Reply with OK only.";
} else if (SAL_isBusy()) {
  // SAL owns this private planning call.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  sal.innerSelfTaskActive = false;
  globalThis.stop = false;
  text = SAL_generationContext(text);
} else {
  const beforeInnerSelf = text;
  let innerTask = false;

  if (SAL_hasInnerSelf()) {
    // Auto-Cards private generation must never replace a typed player action.
    // When it is already active, postpone background events for this one turn.
    SAL_postponeAutoCardsForPlayerInput();

    InnerSelf("context");
    innerTask = SAL_hasInnerSelfTask();

    // If Auto-Cards/Inner Self queued private work anyway (for example on its
    // first enabled turn), postpone it after the fact and restore the player's
    // original narrative call. The queued work can run on a later Continue.
    if (sal.realPlayerInputThisTurn && !sal.autoCardsCommandThisTurn && innerTask) {
      SAL_postponeAutoCardsForPlayerInput();
      if (state.InnerSelf) state.InnerSelf.agent = "";
      if (state.InnerSelf && state.InnerSelf.AC) state.InnerSelf.AC.event = false;
      globalThis.stop = false;
      text = beforeInnerSelf;
      innerTask = false;
    }
  }

  sal.innerSelfTaskActive = innerTask;

  // Arc guidance belongs only in an ordinary narrative model call.
  if (globalThis.stop !== true && !innerTask) {
    text = SAL_injectArc(text);
  }
}

const modifier = (text) => {
  return {
    text,
    stop: globalThis.stop === true
  };
};

modifier(text);
