# Bitcoin object display contract

Stage 1 establishes a fixture-backed frontend presentation contract. It does not add a decode API, Bitcoin Core
lookup, pasted-hex handling, or an application-wide modal service.

## Shared grammar

- A single static Object Display heading leads the page. The object tabs beneath it contain names only, and there is
  no additional object-specific heading.
- The Block tab includes a 64-character Block ID selector with copy, paste, and random icon controls plus centered
  Display and Clear actions. Clear resets the input without removing the displayed block. Stage 1 resolves IDs from
  its included block set and reports unavailable IDs inline; the control can consume a larger block set without
  changing the display interaction.
- Block ID and Transaction ID are the first cards for those durable objects. TxIn and TxOut do not invent synthetic
  identifiers: their selector carries the owning transaction ID and index, while their cards begin with the first
  serialized field. Selecting the first card restores the initial Details view. Copying the relevant value remains
  available from Details, and the display does not claim to verify data.
- The field column is slightly wider than the persistent Details pane so full-width identifiers wrap less often.
  There are no separate basic information and serialization sections.
- Field cards appear once in wire order. Every non-empty serialized field owns an exact byte offset and length, while
  object-level derived and contextual facts remain available in the default Details view.
- Selecting any card updates the Details pane with its explanation, byte range, length, raw bytes, and copy action.
- The right pane has no redundant Details heading or hide control; its selected field title identifies the content.
- Transaction, input, and output collections occupy one ordered card. A block transaction list has a txid search and
  paginates in groups of five when necessary. Each row shows the transaction index and txid and opens the Transaction
  quick view directly; it does not expand transaction fields inside the block. Input and output objects can still
  expand to reveal their constituent fields in wire order.
- Amber denotes Bitcoin data, blue denotes scripts and locking data, violet denotes witness serialization, and green
  denotes navigation/actions. Selection also uses outlines and labels rather than relying on color alone.
- TxIn witness and spent-output details remain explicitly external context because neither is part of the TxIn
  serialization.
- Related objects open the same display shell in a labelled quick-view overlay. The overlay contains focus, supports
  Escape, restores focus, locks background scrolling, and gives its durable **Open full page** action primary visual
  emphasis.
- Blocks emphasize the 80-byte header and expandable transaction list. Complete block hex remains behind disclosure.

## Field contracts

- Block: version, previous block hash, Merkle root, timestamp, bits, nonce, and an expandable transaction list; hash,
  expanded target, header size, full size, height, and available confirmation context remain available in Details.
- Transaction: version, optional marker/flag, expandable input and output lists, witness, and locktime; txid, wtxid,
  raw size, virtual size, and weight remain available in Details.
- TxIn: previous txid, vout, scriptSig length, scriptSig, sequence, and complete TxIn bytes. Witness and previous
  output data are explicitly contextual.
- TxOut: satoshi/BTC amount, scriptPubKey length, scriptPubKey, classification, and complete TxOut bytes.

## Fixture provenance

- Bitcoin mainnet genesis block: canonical bytes already held in Bitclone's genesis and block fixtures. It supplies
  block, coinbase, and legacy scriptSig evidence.
- Legacy P2PKH transaction `40e331…c930`: the verified trace fixture shared by the existing frontend, backend, and
  Bitclone test suites.
- Native P2WPKH transaction `167476…34a6`: the known-valid signature/BIP143 vector in Bitclone's P2WPKH tests,
  including its spent-output amount and scriptPubKey context.

The frontend fixture tests independently double-SHA-256 the relevant serializations, assert the displayed identifiers,
and require every object's byte ranges to cover its raw serialization exactly once without gaps or overlaps.
