# Visualizer Agent Guide

## Working Agreement

Complete an assigned visualizer slice through implementation, tests, responsive QA, and documentation without pausing
for routine design decisions covered here. Bitcoin engine logic belongs in the sibling Bitclone repository, stable HTTP
contracts belong in the backend, and presentation state belongs here. Make coordinated sibling-repository changes when
accuracy requires them; never fabricate cryptographic results to avoid an engine change.

Do not push, deploy, merge, or update external project tracking unless the user explicitly requests it.

## Visual Language

- Preserve the dark navy/charcoal surfaces, amber Bitcoin accents, blue script/locking-data accents, and green
  execution accents established by the site.
- Actions that start or advance execution use green. Blue is for scriptPubKey, selected informational states, links,
  and secondary actions. Amber identifies signatures, scriptSig/unlocking material, and active Bitcoin data.
- Keep hexadecimal data monospace, selectable, safely wrapped, and free of page-level horizontal overflow.
- Design desktop and 390-pixel mobile layouts together. Preserve keyboard access, visible focus, reduced motion,
  semantic tabs, and useful screen-reader labels.
- Use concise educational copy. Prefer showing transformations and their reasons over adding detached explanations.

## Transaction Source

- Center the source selector and keep it visually subordinate to the walkthrough.
- Do not display a `Load a real spend` eyebrow.
- Accept a 64-character transaction ID and zero-based input index.
- Identify the selected input's signature family from transaction context. Legacy inputs show `scriptSig +
  scriptPubKey`; modern inputs show `witness + scriptPubKey`.
- Do not send non-P2PKH inputs to the legacy trace endpoint.
- Label walkthrough selectors `Signature type`, not `Example`.
- Keep the transaction ID/input source form within the Execution workspace; do not present it as a Signature control.
- After a real input is traced, show its outpoint, previous-output `txid:vout`, and the resulting script path before
  execution begins. The scriptPubKey lane must retain that source reference in its visible context.

## Execution and Signature Workspaces

- Keep Execution and Signature as peer workspaces.
- Both use consistent VCR controls: start, previous, play/pause, next, and end, with step count, phase, and progress.
- On desktop, the Signature workspace shows transaction/signing material on the left and the active operation on the
  right. As steps advance, visibly highlight every transaction region committed by the signature mode.
- Keep the Signature workspace's left pane to transaction and UTXO evidence. Put preimages, component hashes, and the
  digest in the active-operation/digest-tracker area rather than treating a digest as a transaction card.
- Anchor the top of a stack state. It may grow downward, and an overflow control must expose additional items without
  shifting the visible top or creating page-level overflow.
- On mobile, stack those panels without losing active highlights or playback controls.
- Legacy steps teach input selection, script replacement, sighash input/output commitments, the four-byte hash-type
  suffix, double SHA-256, and ECDSA verification.
- SegWit v0 steps teach BIP143 component hashes, amount commitment, scriptCode, double SHA-256, and ECDSA verification.
- Taproot steps distinguish key/script paths and teach the tagged TapSighash message and Schnorr verification.
- When an engine boundary is not implemented, show the real script/witness context and a precise `walkthrough not yet
  available` state, then implement that boundary as the next cryptographic slice.

## Definition of Done

1. Run affected unit and integration suites.
2. Run frontend formatting and production builds.
3. Exercise relevant Playwright paths.
4. Inspect desktop and 390-pixel rendered views.
5. Report per-repository commits, anything not pushed, and any live integration that could not run.
