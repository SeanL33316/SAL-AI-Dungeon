const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { read, sourceFor, runHook } = require("./helpers");

test("combined package embeds the exact canonical SAL Library tail", () => {
  assert.equal(sourceFor("combined"), sourceFor("SAL-only"));
});

for (const rel of [
  "SAL-only/1-Library.js", "SAL-only/2-Input.js", "SAL-only/3-Context.js", "SAL-only/4-Output.js",
  "src/1-Library.js", "src/2-Input.js", "src/3-Context.js", "src/4-Output.js"
]) {
  test(rel + " parses as JavaScript", () => {
    assert.doesNotThrow(() => new vm.Script(read(rel), { filename: rel }));
  });
}

test("combined Auto-Cards no longer uses the greedy memory-prefix expression", () => {
  const source = read("src/1-Library.js");
  assert.equal(source.includes('.replace(/^[\\s\\S]*:/g, "")'), false);
  assert.match(source, /memory\|memories/);
  assert.match(source, /old\\s\+memory/);
});

test("typed player action survives a private Auto-Cards event in combined Context", () => {
  const { result, sandbox } = runHook("combined", "3-Context.js", {
    text: "PLAYER ACTION",
    state: {
      SAL: { realPlayerInputThisTurn: true, arc: "" },
      InnerSelf: { agent: "", AC: { enabled: true, event: false } }
    },
    AutoCards: (sb) => () => ({
      API: {
        postponeEvents(turns) {
          sb.postponed = (sb.postponed || 0) + turns;
        }
      }
    }),
    InnerSelf: (sb) => (hook) => {
      if (hook === "context") {
        sb.text = "PRIVATE AUTO-CARDS CONTEXT";
        sb.stop = true;
        sb.state.InnerSelf.AC.enabled = true;
        sb.state.InnerSelf.AC.event = true;
      }
    }
  });
  assert.equal(result.text, "PLAYER ACTION");
  assert.equal(result.stop, false);
  assert.equal(sandbox.state.InnerSelf.AC.event, false);
  assert.ok((sandbox.postponed || 0) >= 1);
});

test("Inner Self thought+story Context still receives SAL guidance", () => {
  const { result } = runHook("combined", "3-Context.js", {
    text: "Recent Story:\nA quiet scene.",
    state: {
      SAL: {
        realPlayerInputThisTurn: false,
        arc: "OPTIONAL STORY ARC LIGHT POSSIBILITIES:\n1. A letter arrives."
      },
      InnerSelf: { agent: "", AC: { enabled: false, event: false } }
    },
    InnerSelf: (sb) => (hook) => {
      if (hook === "context") {
        sb.state.InnerSelf.agent = "Leah";
        sb.text = "INNER SELF CONTEXT\n" + sb.text;
        sb.stop = false;
      }
    }
  });
  assert.equal(result.stop, false);
  assert.match(result.text, /INNER SELF CONTEXT/);
  assert.match(result.text, /STORY ARC LIGHT — OPTIONAL GUIDANCE/);
});

test("combined Output counts hybrid Inner Self thought+story as a normal story turn", () => {
  const { result, sandbox } = runHook("combined", "4-Output.js", {
    text: "(thought) Story continues.",
    state: {
      SAL: { turn: 3, nextArcTurn: 99, innerSelfTaskActive: false, captureGeneration: false, commandPending: false },
      InnerSelf: { agent: "Leah", AC: { enabled: false, event: false } }
    },
    InnerSelf: (sb) => (hook) => {
      if (hook === "output") sb.text = "Story continues.";
    }
  });
  assert.equal(result.text, "Story continues.");
  assert.equal(sandbox.state.SAL.turn, 4);
});

test("combined Output does not advance SAL for genuine private Inner Self/Auto-Cards work", () => {
  const { sandbox } = runHook("combined", "4-Output.js", {
    text: "private generated data",
    state: {
      SAL: { turn: 3, nextArcTurn: 99, innerSelfTaskActive: true, captureGeneration: false, commandPending: false },
      InnerSelf: { agent: "", AC: { enabled: true, event: true } }
    },
    InnerSelf: (sb) => (hook) => {
      if (hook === "output") sb.text = "\u200B";
    }
  });
  assert.equal(sandbox.state.SAL.turn, 3);
});
