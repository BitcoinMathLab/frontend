# Script Visualizer QA

The Script Visualizer at `/visualizer` teaches one curated P2PKH spend and accepts an Explorer selection at
`/visualizer?txid=<txid>&input=<zero-based-index>`. It presents the parsed
`scriptSig` and `scriptPubKey`, the operation currently running, and the resulting main-stack state.
The centered source bar above the workspace also accepts a transaction ID and zero-based input directly. Legacy P2PKH
inputs receive full script and signature walkthroughs. Other legacy, SegWit, and Taproot inputs show their real
scriptSig or witness plus previous scriptPubKey while their verified engine walkthrough boundary is still pending.
The walkthrough finishes with an explicit stack-validation phase: Bitcoin accepts the spend only
when the final stack value is true.

## Automated evidence

Run:

    npm run test:ci
    npm run build
    npm run format:check
    npx playwright test e2e/script-visualizer.spec.ts

With the backend and frontend running locally, verify the real curated trace with:

    BML_E2E_BASE_URL=http://127.0.0.1:4200 BML_LIVE_API=1 npx playwright test e2e/live-api.spec.ts --grep "curated lesson"

The ordinary browser suite uses deterministic mocked API responses. The live check exercises the
frontend, backend, and pinned Bitclone engine together.

## Manual QA

1. Start the backend on `http://127.0.0.1:8000`, start the frontend with `npm start`, then open
   http://localhost:4200/visualizer.
2. At step 0, expect empty stacks, `Ready`, and a visible script flow. Selecting an opcode or data
   item opens its explanation without advancing playback.
3. Use Play, Pause, Previous, Next, Restart, and Go to result. Repeat with Arrow keys, Home, End,
   and Space. Expect the step counter, progress bar, execution card, and stack state to stay in
   sync.
4. Inspect a stack value. A one-item stack reports position `1`; a multi-item stack reports
   `1 (Top)` for its first item and `n (Bottom)` for its final item. The popup reports the data type
   only in its `DATA (…)` heading.
5. Confirm popup-card semantics: the card type is green and hexadecimal data is amber. Press Escape
   after each popup and expect focus to return to the item that opened it.
6. Select `scriptSig` and `scriptPubKey` themselves. Expect source dialogs identifying the spending transaction input
   and previous transaction output. At `OP_CHECKSIG`, open the Signature workspace. Use its start, previous, play/pause,
   next, and end controls to walk through input selection, script replacement, sighash commitments, hashing, and ECDSA
   verification. Expect the transaction regions used by each step to highlight. The Execution/Signature tabs must
   respond to Left/Right, Home, and End keys.
7. Enter a confirmed P2PKH spending transaction and input index in the source bar, then activate `Trace input`. Expect
   the resulting script provenance to identify that transaction and input.
8. From Explorer, activate `Visualize this spend` on both a P2PKH and a modern input. Expect the visualizer source
   transaction and input to match the Explorer result.
9. Enter a SegWit or Taproot spend. Expect the ordered witness items and previous output scriptPubKey, the detected
   signature type, and an explicit notice that its verified walkthrough is not yet available. Do not expect the legacy
   P2PKH trace endpoint to run.
10. Advance through the last opcode. The final playback phase must read `STACK VALIDATION` and
    explain that the spend is valid only when the final stack value is true. The verdict must not
    appear before this phase.
11. Exercise the failed-trace response. Expect `Invalid spend` and a safe failure explanation only
    at the final validation phase; do not expect engine internals, credentials, or a traceback.
12. Repeat the walkthrough at a 390-pixel viewport and with reduced motion enabled. Expect no
    page-level horizontal overflow, usable controls, and no essential motion.

Record one of `Accepted`, `Accepted with follow-up`, or `Changes requested` for the release
candidate. Production validation additionally requires the smoke and rollback checks in
[`docs/deployment.md`](deployment.md).
