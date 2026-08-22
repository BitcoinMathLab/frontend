# Transaction Explorer QA

The transaction explorer at `/labs/transaction-explorer` retrieves transaction context through the backend without
exposing Bitcoin Core credentials to the browser. It displays the transaction ID, raw byte count, coinbase status, raw
hex, every created output, each input's ordered previous output, and the standard output/spend-path classification
supplied by Bitclone.

The explorer loads its verified example catalog from `/api/v1/transactions/examples`. Each concept card selects a
confirmed mainnet txid and states the expected input/output shape before the learner inspects it.

## Automated evidence

Run:

    npm run test:ci
    npm run test:config
    npm run build
    npm run test:e2e

Unit coverage verifies the API URL and method, input/output rendering, client-side validation, and the safe 503 state.
Playwright covers the same user paths and checks a 390-pixel viewport for horizontal overflow. The browser tests mock
the transaction endpoint so they do not depend on a synchronized local node.

With the backend, Core tunnel, and frontend running, verify the full catalog path with:

    BML_LIVE_API=1 npx playwright test e2e/live-api.spec.ts --grep "catalog example"

## Manual setup

1. Start the backend with its Bitcoin Core RPC environment configured.
2. Confirm both `initialblockdownload` and `txindex.synced` are false/true respectively: initial block download must be
   complete and the transaction index must be synchronized.
3. Start the frontend with `npm start` and open http://localhost:4200/labs/transaction-explorer.
4. Use a confirmed mainnet transaction that remains available to the Core node. The prefilled transaction ID is the
   story fixture.

If `txindex` is still building, the safe unavailable-path validation below can be completed immediately; defer the
successful historical lookup until synchronization finishes.

## QA validation

- **Happy path:** Submit the prefilled confirmed transaction ID. Expect one result, a matching transaction ID, raw byte
  count, coinbase status, raw hex, and previous outputs in input order. Expect each input to show its output type and
  spend path; nested SegWit also shows the redeem script.
- **Input/output regression:** Submit
  `fff2525b8931402dd09222c50775608f75787bd2b87e56995a7bdd30f79702c4`. Expect one input and two outputs. Output 0
  contains 556,000,000 sats and output 1 contains 4,444,000,000 sats; both locking scripts are visible.
- **Validation:** Replace the field with a short value or a non-hexadecimal character and submit. Expect an inline
  64-character validation error and no network request.
- **Clear:** After a successful lookup or validation error, activate Clear. Expect the input, result, and error state to
  be removed without sending another request.
- **Field actions:** Copy writes the current txid to the clipboard, Paste replaces it without submitting, and Random
  selects a different example from the versioned catalog without submitting.
- **Example catalog:** Expect labeled cards for genesis, early payment/change, P2PKH, P2WPKH, and P2WSH. Selecting a
  card replaces the txid without issuing a context request; Inspect remains the explicit lookup action.
- **Unavailable Core:** Stop Core, interrupt the tunnel, or test while `txindex` is building. Expect a safe message that
  Core is catching up or unavailable, with no hostnames, credentials, or internal exception detail.
- **Boundary:** Load the genesis coinbase transaction
  `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`. Expect `Coinbase: Yes`, zero inputs, its
  created output, and an explanation that no previous outputs are spent.
- **Responsive:** Repeat at 390 pixels wide. Expect the form, long transaction IDs, scripts, and raw hex to remain within
  the viewport without page-level horizontal scrolling.
- **Accessibility:** Use the keyboard to focus the input and submit button. Expect visible focus, a labeled textbox,
  announced loading status, and announced validation/API errors.
- **Regression:** Open the Script Visualizer and its valid and invalid lessons. Expect its trace loading and controls to
  remain unchanged.

Record one of `Accepted`, `Accepted with follow-up`, or `Changes requested` in the PR review. Do not paste the Core RPC
cookie, password, tunnel command, or private infrastructure details into the review.
