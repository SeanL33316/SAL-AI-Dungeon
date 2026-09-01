// ============================================================================
// STORY ARC LIGHT (SAL) — CONTEXT TAB — v1.2.0
// ============================================================================

globalThis.stop ??= false;

if (SAL_isBusy()) {
  // SAL owns this private planning call.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  text = onContext_SAE(text);
} else {
  const contextBeforeInnerSelf = text;
  let innerSelfTask = false;

  if (SAL_hasInnerSelf()) {
    InnerSelf("context");
    innerSelfTask = SAL_hasInnerSelfTask();

    // A real player's action always receives a normal story response.
    if (state.SAL?.realPlayerInputThisTurn === true && innerSelfTask) {
      if (state.InnerSelf) state.InnerSelf.agent = "";
      globalThis.stop = false;
      text = contextBeforeInnerSelf;
      innerSelfTask = false;
    }
  }

  // Only feed SAL guidance into normal narrative context, never an Inner Self
  // private brain-generation prompt.
  if (globalThis.stop !== true && !innerSelfTask) {
    SAL_softenStoredArc();
    text = onContext_SAE(text);
  }
}

const modifier = (text) => {
  return {
    text,
    stop: globalThis.stop === true
  };
};

modifier(text);
