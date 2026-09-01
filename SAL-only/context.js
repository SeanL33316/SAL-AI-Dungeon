// ============================================================================
// SAL — STORY ARC LIGHT — AI DUNGEON CONTEXT — v1.3.1
// Paste this entire file into the Context tab.
// ============================================================================

globalThis.stop ??= false;
const sal = SAL_state();

if (SAL_isBusy()) {
  // SAL owns this private planning call.
  if (state.InnerSelf) state.InnerSelf.agent = "";
  sal.innerSelfTaskActive = false;
  text = SAL_generationContext(text);
} else {
  const beforeInnerSelf = text;
  let innerTask = false;

  if (SAL_hasInnerSelf()) {
    InnerSelf("context");
    innerTask = SAL_hasInnerSelfTask();

    // Never let a private Inner Self task consume an explicit player action.
    if (sal.realPlayerInputThisTurn && innerTask) {
      if (state.InnerSelf) state.InnerSelf.agent = "";
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
