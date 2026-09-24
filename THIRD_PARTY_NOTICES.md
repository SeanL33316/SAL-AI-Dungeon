# Third-party notices and provenance

## Inner Self and Auto-Cards — LewdLeah

The combined Library contains Inner Self **1.0.2**, its MainSettings control panel, Auto-Cards **1.1.3**, and the optional Live Script Interface helper. Copyright (c) 2026 LewdLeah. The upstream MIT text is preserved without modification in [LICENSE-INNER-SELF](LICENSE-INNER-SELF).

- Source: [LewdLeah/Inner-Self](https://github.com/LewdLeah/Inner-Self)
- Pinned source commit: [`297a1a04c0e11b41f69e3e57a607b47eee34334b`](https://github.com/LewdLeah/Inner-Self/tree/297a1a04c0e11b41f69e3e57a607b47eee34334b)
- Upstream file: [`src/library.js`](https://github.com/LewdLeah/Inner-Self/blob/297a1a04c0e11b41f69e3e57a607b47eee34334b/src/library.js)
- Original raw SHA-256: `3e79ed8b6f404e9619d1f0a0f6250897d4521ed84e905fa2d74b00db66240abe`
- Original UTF-8 text after trimming trailing whitespace, SHA-256: `c2e2ed8e664ea88ea0e35faa77287a9ad517416dbadbd2f16dc79815b3c70fea`

Before this release preparation, the bundled prefix matched that upstream file exactly after trimming trailing whitespace. SAL 1.3.9 keeps that prefix with **two local code patches**:

**Auto-Cards memory cleanup:** parentheses now enclose the final conditional suffix in the `Memories:` replacement callback. Previously, operator precedence made the whole accumulated memory string the condition of a ternary, discarding valid memory text. A regression test runs the actual bundled callback through `AutoCards(null)`.

**Auto-Cards compression cleanup:** the release branch also replaces a greedy prefix expression with a recognized memory-label prefix, preserving prose containing colons.

The first patch is identified inline with `// SAL patch: preserve valid memories.`. Repository checks reverse both patches and verify the normalized upstream hash, so accidental vendor changes fail verification. SAL coordination behavior lives in SAL's own core/hooks rather than rewriting Inner Self.

Preserve upstream authorship, comments, license, and this patch record when redistributing or updating the combined bundle. This is not a new official release of Inner Self or Auto-Cards.

## Story Arc Engine — Yi1i1i

[Story Arc Engine (SAE)](https://github.com/Yi1i1i/Story-Arc-Engine) originated the story-arc planning approach that SAL developed from. Early SAL repository history used SAE as a separately obtained backend; the present SAL core is a self-contained implementation and does not require that download.

The SAE source reviewed for this audit was commit [`9c5b74e66576f5db14ef6d1a40524916ee48e2fa`](https://github.com/Yi1i1i/Story-Arc-Engine/tree/9c5b74e66576f5db14ef6d1a40524916ee48e2fa). Its repository did not provide a software license file at that revision. SAL's MIT license does not purport to license SAE's upstream repository. Do not copy additional SAE source into this project on the assumption that its public visibility supplies redistribution permission.

## SAL

SAL-authored implementation, integration hooks, tests, and documentation are covered by [LICENSE](LICENSE), copyright (c) 2026 SeanL33316. This project's credit to upstream authors does not imply their endorsement of SAL's modifications.
