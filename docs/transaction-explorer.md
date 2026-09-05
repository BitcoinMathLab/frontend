# Transaction Explorer QA

The transaction explorer at `/explorer` retrieves transaction context through the backend without
exposing Bitcoin Core credentials to the browser. It displays transaction identity and format, size/weight/vsize,
value and fee summaries, every created output, each input's ordered previous output, standard output/spend-path
classification, and guided raw-byte ranges supplied by Bitclone.

The explorer loads its verified example catalog from `/api/v1/transactions/examples` for the Random action. Random,
Paste, and typing only populate the field; **Inspect transaction** remains the explicit action that retrieves context.

## Automated evidence

Run:

    npm run test:ci
    npm run test:config
    npm run build
    npm run test:e2e

Unit coverage verifies the API URL and method, input/output rendering, client-side validation, and the safe 503 state.
Playwright covers the same user paths and checks a 390-pixel viewport for horizontal overflow. The browser tests mock
the transaction endpoint so they do not depend on a synchronized local node.

With the backend, Core tunnel, and frontend running, verify the live Explorer path with:

```bash
BML_LIVE_API=1 npx playwright test e2e/live-api.spec.ts --grep "Explorer transaction"
```

## Manual setup

1. Start the backend with its Bitcoin Core RPC environment configured.
2. Confirm both `initialblockdownload` and `txindex.synced` are false/true respectively: initial block download must be
   complete and the transaction index must be synchronized.
3. Start the frontend with `npm start` and open http://localhost:4200/explorer.
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
- **Curated Random:** Activate Random and expect a verified example txid to replace the current value without issuing a
  context request; Inspect remains the explicit lookup action.
- **Unavailable Core:** Stop Core, interrupt the tunnel, or test while `txindex` is building. Expect a safe message that
  Core is catching up or unavailable, with no hostnames, credentials, or internal exception detail.
- **Boundary:** Load the genesis coinbase transaction
  `4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b`. Expect `Coinbase: Yes`, zero inputs, its
  created output, and an explanation that no previous outputs are spent.
- **Responsive:** Repeat at 390 pixels wide. Expect the form, long transaction IDs, scripts, and raw hex to remain within
  the viewport without page-level horizontal scrolling.
- **Accessibility:** Use the keyboard to focus the input and submit button. Expect visible focus, a labeled textbox,
  announced loading status, and announced validation/API errors.
- **Regression:** Open the Script Visualizer. Expect empty stacks at step 0, script items that open information without
  advancing, working playback controls, and a spend verdict only at the final step.

Record one of `Accepted`, `Accepted with follow-up`, or `Changes requested` in the PR review. Do not paste the Core RPC
cookie, password, tunnel command, or private infrastructure details into the review.
