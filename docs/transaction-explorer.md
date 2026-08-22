# Transaction Explorer QA

The transaction explorer at `/labs/transaction-explorer` retrieves transaction context through the backend without
exposing Bitcoin Core credentials to the browser. It displays the transaction ID, raw byte count, coinbase status, raw
hex, each input's ordered previous output, and the standard output/spend-path classification supplied by Bitclone.

## Automated evidence

Run:

    npm run test:ci
    npm run test:config
    npm run build
    npm run test:e2e

Unit coverage verifies the API URL and method, successful rendering, client-side validation, and the safe 503 state.
Playwright covers the same user paths and checks a 390-pixel viewport for horizontal overflow. The browser tests mock
the transaction endpoint so they do not depend on a synchronized local node.

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
- **Validation:** Replace the field with a short value or a non-hexadecimal character and submit. Expect an inline
  64-character validation error and no network request.
- **Unavailable Core:** Stop Core, interrupt the tunnel, or test while `txindex` is building. Expect a safe message that
  Core is catching up or unavailable, with no hostnames, credentials, or internal exception detail.
- **Boundary:** Load a coinbase transaction. Expect `Coinbase: Yes`, zero inputs, and an explanation that no previous
  outputs are spent.
- **Responsive:** Repeat at 390 pixels wide. Expect the form, long transaction IDs, scripts, and raw hex to remain within
  the viewport without page-level horizontal scrolling.
- **Accessibility:** Use the keyboard to focus the input and submit button. Expect visible focus, a labeled textbox,
  announced loading status, and announced validation/API errors.
- **Regression:** Open the Script Visualizer and its valid and invalid lessons. Expect its trace loading and controls to
  remain unchanged.

Record one of `Accepted`, `Accepted with follow-up`, or `Changes requested` in the PR review. Do not paste the Core RPC
cookie, password, tunnel command, or private infrastructure details into the review.
