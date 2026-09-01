# Visualizer follow-on work items

These items capture the next decisions from the product review after the transaction/UTXO and
script-preparation pass. They are local planning notes, not external project-tracker items.

## VIZ-01 — Make UTXO discovery an explicit, inspectable transition

The current Script Preparation panel truthfully shows the selected input outpoint, the resolved
previous output, and the resulting execution path. Refine it into a user-driven `Find UTXO`
transition that visibly moves the outpoint into the prior transaction/output lookup before
revealing `scriptPubKey` and execution.

Acceptance criteria:

- Keep the real selected `txid:vout` visible at every stage.
- Do not create a synthetic previous transaction or UTXO.
- Preserve keyboard access and the 390px layout.

## VIZ-02 — Complete the standalone signature-verifier contract

Add a verified Signature-workspace mode for a transaction ID, input index, and DER signature.
This requires a stable backend/Bitclone boundary that derives the correct public key and signature
message from real transaction context, then reports an actual ECDSA result.

Acceptance criteria:

- Do not add a functional-looking form until the backend can verify the supplied DER signature.
- Keep the Execution transaction source form scoped to Execution.
- Validate DER input and return safe, precise errors.
- Reuse the transaction/UTXO and digest-tracker presentation rather than duplicating a stack view.

## VIZ-03 — Expand signature transaction commitments without visual overload

The Signature workspace now shows canonical transaction header fields, selectable inputs, the
selected input, the UTXO, and the digest tracker. For transactions with multiple inputs and
outputs, refine the compact input/output list so each committed region can be selected and its
exact serialized fields highlighted as the walkthrough advances.

Acceptance criteria:

- The selected input is zero-based in every visible label.
- The left pane remains limited to transaction and UTXO evidence.
- Hashes, preimages, and the final digest remain in the right-side operation/digest area.
- Validate with a multi-input legacy case and a multi-input P2WPKH case.

## VIZ-04 — Exercise stack overflow with a real deep-stack example

The stack view now holds its top edge and exposes a dialog when more than six items are present.
Add or select a real trace fixture that exceeds six stack items, then verify the overflow dialog,
focus handling, and compact mobile behavior.

Acceptance criteria:

- The visible stack grows downward from a fixed top edge.
- The overflow dialog exposes all items and returns focus on close.
- No horizontal page overflow at 390px.
