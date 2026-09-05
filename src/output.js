// ============================================================================
// INNER SELF + SAL — COMBINED AI DUNGEON OUTPUT
// Short coordination hook based on the proven scenario structure.
// ============================================================================

const sal = SAL_state();

if (sal.commandPending) {
  // Swallow the unavoidable Phoenix command generation. Do not advance SAL's
  // story counter and do not let Inner Self consume this utility turn.
  text = String(sal.commandResponse || "SAL command completed.");
  sal.commandPending = false;
  sal.commandResponse = "";
  sal.realPlayerInputThisTurn = false;
  sal.innerSelfTaskActive = false;
} else if (sal.captureGeneration) {
  // This model output is SAL's private eight-beat planning response.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  text = SAL_processGeneratedOutput(text);
} else if (SAL_hasInnerSelf() && sal.innerSelfTaskActive) {
  // Let Inner Self consume/hide its own private brain-operation output.
  InnerSelf("output");
  sal.innerSelfTaskActive = false;
  sal.realPlayerInputThisTurn = false;
} else {
  if (SAL_hasInnerSelf()) InnerSelf("output");
  text = SAL_onNormalOutput(text);
}

text = SAL_outputCommands(text);

// AI Dungeon throws an error if Output returns an empty string.
if (typeof text !== "string" || text.length === 0) text = "\u200B";

const modifier = (text) => {
  return { text };
};

modifier(text);
