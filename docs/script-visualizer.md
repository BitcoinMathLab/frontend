# Script Visualizer QA

The Script Visualizer at `/visualizer` teaches a curated P2PKH spend and accepts an Explorer selection at
`/visualizer?txid=<txid>&input=<zero-based-index>`. It presents the parsed
`scriptSig` and `scriptPubKey`, the operation currently running, and the resulting main-stack state.
The centered source bar above the workspace accepts a transaction ID and zero-based input directly. It also offers a
Random action backed by the verified curated P2PKH request, so the walkthrough remains usable without Bitcoin Core.
The page progressively reveals script preparation after `Trace input`. Two concise Reference cards connect the
selected input to its spent output through the outpoint; each card opens the corresponding Object Display quick view
from the loaded trace data. The preparation workspace keeps a visibly empty main stack below the pending execution lane so
scripts are never misrepresented as stack values. After `Assemble execution`, the script flow appears above the empty
stack and playback controls become available. `Clear` returns to the source-only state. Legacy P2PKH
inputs receive full script and signature walkthroughs. Native P2WPKH inputs receive a verified witness-stack execution
trace plus a synchronized BIP143 signature walkthrough covering component hashes, the spent amount, derived
`scriptCode`, four-byte hash type, double SHA-256, and ECDSA. Other legacy, SegWit, and Taproot inputs show their real
scriptSig or witness plus previous scriptPubKey while their verified engine walkthrough boundary is still pending.
Legacy bare P2MS inputs receive a verified combined-script trace, including the historical empty CHECKMULTISIG dummy,
ordered signatures, m-of-n threshold, committed public keys, and `OP_CHECKMULTISIG`. Their Signature workspace states
precisely that a synchronized per-signature sighash walkthrough is not yet available.
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
2. Before loading a trace, expect only the transaction ID, input index, `Trace input`, and `Random` actions. Activate
   `Random` and expect the verified curated P2PKH trace to reveal script preparation without playback controls.
3. Open the left Reference card and expect a TxIn quick view. Activate `Find spent output`, then open the right
   Reference card and expect a TxOut quick view. Closing either popup restores focus without changing preparation.
   The pending main stack remains empty.
4. Activate `Assemble execution`. Expect preparation to disappear, the script sources to populate the execution flow,
   and the main stack to remain empty until Play advances an instruction. Playback controls and the
   Execution/Signature tabs now appear.
5. At step 0, expect empty stacks, `Ready`, and a visible script flow. Selecting an opcode or data
   item opens its explanation without advancing playback.
6. Use Play, Pause, Previous, Next, Restart, and Go to result. Repeat with Arrow keys, Home, End,
   and Space. Expect the step counter, progress bar, execution card, and stack state to stay in
   sync.
7. Inspect a stack value. A one-item stack reports position `1`; a multi-item stack reports
   `1 (Top)` for its first item and `n (Bottom)` for its final item. The popup reports the data type
   only in its `DATA (…)` heading.
8. Confirm popup-card semantics: the card type is green and hexadecimal data is amber. Press Escape
   after each popup and expect focus to return to the item that opened it.
9. Select `scriptSig` and `scriptPubKey` themselves. Expect source dialogs identifying the spending transaction input
   and previous transaction output. At `OP_CHECKSIG`, open the Signature workspace. Use its start, previous, play/pause,
   next, and end controls to walk through input selection, script replacement, sighash commitments, hashing, and ECDSA
   verification. Expect the transaction regions used by each step to highlight. The Execution/Signature tabs must
   respond to Left/Right, Home, and End keys.
10. Enter a confirmed P2PKH spending transaction and input index in the source bar, then activate `Trace input`. Expect
    the resulting script provenance to identify that transaction and input.
11. From Explorer, activate `Visualize this spend` on both a P2PKH and a modern input. Expect the visualizer source
    transaction and input to match the Explorer result.
12. Enter a native P2WPKH spend. Expect the ordered witness items to initialize the stack, the derived P2PKH `scriptCode`
    to execute, and the Signature workspace to highlight `hashPrevouts`, `hashSequence`, `hashOutputs`, amount, and
    `scriptCode` as BIP143 is assembled and verified. For P2WSH or Taproot, expect the real context and an explicit
    notice that its verified walkthrough is not yet available. Modern inputs must never call the legacy P2PKH endpoint.
13. Enter bare P2MS transaction
    `949591ad468cef5c41656c0a502d9500671ee421fadb590fbc6373000039b693`, input `0`. Expect a 2-of-3 P2MS trace with
    previous outpoint `581d30e2a73a2db683ac2f15d53590bd0cd72de52555c2722d9d6a78e9fea510:0`, the empty dummy, two signatures,
    three public keys, and `OP_CHECKMULTISIG`. Expect a valid final stack and a precise unavailable state—not P2PKH
    claims—in the Signature workspace.
14. Advance through the last opcode. The final playback phase must read `STACK VALIDATION` and
    explain that the spend is valid only when the final stack value is true. The verdict must not
    appear before this phase.
15. Exercise the failed-trace response. Expect `Invalid spend` and a safe failure explanation only
    at the final validation phase; do not expect engine internals, credentials, or a traceback.
16. Activate `Clear` from preparation and again from an assembled trace. Expect all trace, error, workspace, playback,
    and highlight state to disappear while the empty source controls remain. Start another Random trace and verify it
    begins at preparation.
17. Repeat the walkthrough at a 390-pixel viewport and with reduced motion enabled. Expect no
    page-level horizontal overflow, usable controls, and no essential motion.

Record one of `Accepted`, `Accepted with follow-up`, or `Changes requested` for the release
candidate. Production validation additionally requires the smoke and rollback checks in
[`docs/deployment.md`](deployment.md).
