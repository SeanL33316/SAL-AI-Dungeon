from pathlib import Path

sal = Path('SAL-only/library.js').read_text()
combined = Path('src/library.js').read_text()
marker = '// ============================================================================\n// SAL — STORY ARC LIGHT — AI DUNGEON LIBRARY —'
assert combined[combined.index(marker):] == sal[sal.index(marker):]


def body(path, marker):
    text = Path(path).read_text()
    return text[text.index(marker):]

assert body('src/input.js', 'SAL_protectPlayerInput') == body('SAL-only/input.js', 'SAL_protectPlayerInput')
assert body('src/context.js', 'globalThis.stop') == body('SAL-only/context.js', 'globalThis.stop')
assert body('src/output.js', 'const sal = SAL_state();') == body('SAL-only/output.js', 'const sal = SAL_state();')
print('Combined and SAL-only functional code match')
