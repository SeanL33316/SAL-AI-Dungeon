// ============================================================================
// STORY ARC LIGHT (SAL) — OUTPUT TAB — v1.2.0
// ============================================================================

const salOwnsThisOutput = SAL_isBusy();

if (salOwnsThisOutput) {
  if (state.InnerSelf) state.InnerSelf.agent = "";
  text = onOutput_SAE(text);
  SAL_softenStoredArc();
} else {
  if (SAL_hasInnerSelf()) {
    const innerSelfTaskBeforeOutput = SAL_hasInnerSelfTask();
    InnerSelf("output");

    if (!innerSelfTaskBeforeOutput) {
      text = onOutput_SAE(text);
      SAL_softenStoredArc();
    }
  } else {
    text = onOutput_SAE(text);
    SAL_softenStoredArc();
  }
}

text = SAL_outputCommands(text);
state.SAL = state.SAL || {};
state.SAL.realPlayerInputThisTurn = false;

if (typeof text !== "string" || text.length === 0) {
  text = "\u200B";
}

const modifier = (text) => {
  return { text };
};

modifier(text);
