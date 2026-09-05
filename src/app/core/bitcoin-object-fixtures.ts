import {
  BitcoinObjectField,
  BitcoinObjectFixture,
  BitcoinObjectKind,
} from '../features/bitcoin-object-display/bitcoin-object-display.models';

/*
 * Stage 1 provenance
 * ------------------
 * GENESIS_BLOCK_HEX is Bitcoin mainnet block 0, already parsed as a canonical
 * fixture by Bitclone (`src/blockchain/genesis_block.py` and `src/block/block.py`).
 * LEGACY_TRANSACTION_HEX is the verified historical P2PKH spend used by the
 * frontend, backend, and Bitclone trace suites (txid 40e331…c930).
 * P2WPKH_TRANSACTION_HEX and its spent-output context are the known-valid
 * native P2WPKH vector used by Bitclone's signature and BIP143 tests.
 *
 * Values and byte ranges below are intentionally fixture data, not a decoding
 * API. Hash, coverage, and range assertions live in the adjacent fixture spec.
 */

export const GENESIS_BLOCK_HASH =
  '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';
export const GENESIS_TXID = '4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
export const GENESIS_BLOCK_HEX =
  '010000000000000000000000000000000000000000000000000000000000000000000000' +
  '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a' +
  '29ab5f49ffff001d1dac2b7c01' +
  '01000000010000000000000000000000000000000000000000000000000000000000000000' +
  'ffffffff4d04ffff001d0104455468652054696d65732030332f4a616e2f3230303920436861' +
  '6e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f' +
  '722062616e6b73ffffffff0100f2052a01000000434104678afdb0fe5548271967f1a67130b7' +
  '105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7' +
  'ba0b8d578a4c702b6bf11d5fac00000000';

export const LEGACY_TXID = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
export const LEGACY_TRANSACTION_HEX =
  '0100000001a4e61ed60e66af9f7ca4f2eb25234f6e32e0cb8f6099db21a2462c42de61640b010000006b' +
  '483045022100c233c3a8a510e03ad18b0a24694ef00c78101bfd5ac075b8c1037952ce26e91e02205aa5f8f88f29bb' +
  '4ad5808ebc12abfd26bd791256f367b04c6d955f01f28a7724012103f0609c81a45f8cab67fc2d050c21b1acd3d37c' +
  '7acfd54041be6601ab4cef4f31feffffff02f9243751130000001976a9140c443537e6e31f06e6edb2d4bb80f8481e' +
  '2831ac88ac14206c00000000001976a914d807ded709af8893f02cdc30a37994429fa248ca88ac751a0600';

export const P2WPKH_TXID = '1674761a2b5cb6c7ea39ef58483433e8735e732f5d5815c9ef90523a91ed34a6';
export const P2WPKH_WTXID = '239ffa52c1bd0cca710c71de802bc63b54b6b7e0709972c1a9cbf7bee7f3ad18';
export const P2WPKH_PREVIOUS_TXID =
  'c178d8dacdfb989f9d4fa45828ed188cd54a0414d625c3e61e75c5e3ac15a83a';
export const P2WPKH_TRANSACTION_HEX =
  '020000000001013aa815ace3c5751ee6c325d614044ad58c18ed2858a44f9d9f98fbcddad87' +
  '8c10000000000ffffffff01344d10000000000016001430cd68883f558464ec7939d9f960956' +
  '422018f0702483045022100c7fb3bd38bdceb315a28a0793d85f31e4e1d9983122b4a5de741' +
  'd6ddca5caf8202207b2821abd7a1a2157a9d5e69d2fdba3502b0a96be809c34981f8445555b' +
  'dafdb012103f465315805ed271eb972e43d84d2a9e19494d10151d9f6adb32b8534bfd764ab0' +
  '0000000';

function field(
  id: string,
  label: string,
  value: string,
  rawHex: string,
  offset: number,
  description: string,
  tone: BitcoinObjectField['tone'] = 'neutral',
): BitcoinObjectField {
  return {
    id,
    label,
    value,
    rawHex,
    range: { offset, length: rawHex.length / 2 },
    description,
    tone,
  };
}

const blockFields: readonly BitcoinObjectField[] = [
  field('version', 'Version', '1', '01000000', 0, 'Header version, encoded little-endian.'),
  field(
    'previous-block',
    'Previous block hash',
    '0000000000000000000000000000000000000000000000000000000000000000',
    '00'.repeat(32),
    4,
    'Block zero has no parent, so its previous-block field is all zeroes.',
  ),
  field(
    'merkle-root',
    'Merkle root',
    GENESIS_TXID,
    '3ba3edfd7a7b12b27ac72c3e67768f617fc81bc3888a51323a9fb8aa4b1e5e4a',
    36,
    'Commits the header to the block transaction set. Hash bytes are serialized least-significant byte first.',
    'bitcoin',
  ),
  field(
    'timestamp',
    'Timestamp',
    '2009-01-03 18:15:05 UTC · 1231006505',
    '29ab5f49',
    68,
    'Unix timestamp chosen by the miner.',
  ),
  field(
    'bits',
    'Bits',
    '0x1d00ffff',
    'ffff001d',
    72,
    'Compact representation of the proof-of-work target.',
    'bitcoin',
  ),
  field('nonce', 'Nonce', '2083236893', '1dac2b7c', 76, 'Miner-adjusted proof-of-work nonce.'),
  field(
    'transaction-count',
    'Transaction count',
    '1',
    '01',
    80,
    'CompactSize count of transactions following the 80-byte header.',
  ),
  {
    ...field(
      'transaction-0',
      'Transaction 0',
      GENESIS_TXID,
      GENESIS_BLOCK_HEX.slice(162),
      81,
      'The block-zero coinbase transaction. Its scriptSig contains the Times headline.',
      'bitcoin',
    ),
    reference: {
      label: 'Open coinbase transaction',
      detail: `${GENESIS_TXID.slice(0, 12)}…${GENESIS_TXID.slice(-8)}`,
      fixtureId: 'genesis-transaction',
      route: `/display/transaction/${GENESIS_TXID}`,
    },
  },
];

const legacyTransactionFields: readonly BitcoinObjectField[] = [
  field('version', 'Version', '1', '01000000', 0, 'Transaction format version.'),
  field('input-count', 'Input count', '1', '01', 4, 'CompactSize number of inputs.'),
  field(
    'input-0-previous-txid',
    'Input 0 · previous txid',
    '0b6461de422c46a221db99608fcbe0326e4f2325ebf2a47c9faf660ed61ee6a4',
    LEGACY_TRANSACTION_HEX.slice(10, 74),
    5,
    'Identifies the transaction containing the output being spent.',
    'bitcoin',
  ),
  field('input-0-vout', 'Input 0 · vout', '1', '01000000', 37, 'Zero-based previous-output index.'),
  field(
    'input-0-script-size',
    'Input 0 · scriptSig size',
    '107 bytes',
    '6b',
    41,
    'CompactSize length of scriptSig.',
  ),
  field(
    'input-0-script-sig',
    'Input 0 · scriptSig',
    'ECDSA signature + compressed public key',
    LEGACY_TRANSACTION_HEX.slice(84, 298),
    42,
    'Legacy unlocking data serialized directly inside the input.',
    'script',
  ),
  field(
    'input-0-sequence',
    'Input 0 · sequence',
    '4294967294 · relative locktime disabled',
    'feffffff',
    149,
    'Sequence value for this input.',
  ),
  field('output-count', 'Output count', '2', '02', 153, 'CompactSize number of new outputs.'),
  field(
    'output-0-amount',
    'Output 0 · amount',
    '82,966,947,065 sats · 829.66947065 BTC',
    'f924375113000000',
    154,
    'Output value in little-endian satoshis.',
    'bitcoin',
  ),
  field(
    'output-0-script-size',
    'Output 0 · scriptPubKey size',
    '25 bytes',
    '19',
    162,
    'CompactSize length of scriptPubKey.',
  ),
  field(
    'output-0-script',
    'Output 0 · scriptPubKey',
    'P2PKH',
    LEGACY_TRANSACTION_HEX.slice(326, 376),
    163,
    'Locks output 0 to a public-key hash.',
    'script',
  ),
  field(
    'output-1-amount',
    'Output 1 · amount',
    '7,086,100 sats · 0.07086100 BTC',
    '14206c0000000000',
    188,
    'Output value in little-endian satoshis.',
    'bitcoin',
  ),
  field(
    'output-1-script-size',
    'Output 1 · scriptPubKey size',
    '25 bytes',
    '19',
    196,
    'CompactSize length of scriptPubKey.',
  ),
  field(
    'output-1-script',
    'Output 1 · scriptPubKey',
    'P2PKH',
    LEGACY_TRANSACTION_HEX.slice(394, 444),
    197,
    'Locks output 1 to a public-key hash.',
    'script',
  ),
  field(
    'locktime',
    'Locktime',
    '400,005 · block height',
    '751a0600',
    222,
    'Earliest block height at which this transaction may be mined.',
  ),
];

const p2wpkhInputHex = P2WPKH_TRANSACTION_HEX.slice(14, 96);
const p2wpkhWitnessHex = P2WPKH_TRANSACTION_HEX.slice(160, 376);

const fixtures: readonly BitcoinObjectFixture[] = [
  {
    id: 'genesis-block',
    kind: 'block',
    typeLabel: 'Block',
    identifier: GENESIS_BLOCK_HASH,
    rawHex: GENESIS_BLOCK_HEX,
    rawLabel: 'Complete serialized block',
    rawDisclosureLabel: 'Reveal all 285 bytes',
    fields: blockFields,
    derivedFields: [
      {
        label: 'Target',
        value: '00000000ffff0000000000000000000000000000000000000000000000000000',
        description: 'Full proof-of-work target expanded from bits.',
      },
      { label: 'Header size', value: '80 bytes' },
      { label: 'Serialized size', value: '285 bytes' },
    ],
    contextFields: [
      { label: 'Height', value: '0', description: 'Chain position; not serialized in the block.' },
      {
        label: 'Confirmations',
        value: 'Historical fixture',
        description:
          'Live confirmation count requires chain context and is intentionally not simulated.',
      },
    ],
    references: [blockFields[7].reference!],
    fullPageRoute: `/display/block/${GENESIS_BLOCK_HASH}`,
  },
  {
    id: 'legacy-transaction',
    kind: 'transaction',
    typeLabel: 'Transaction',
    identifier: LEGACY_TXID,
    rawHex: LEGACY_TRANSACTION_HEX,
    rawLabel: 'Complete serialized transaction',
    fields: legacyTransactionFields,
    derivedFields: [
      {
        label: 'Witness transaction ID',
        value: LEGACY_TXID,
        description: 'A legacy transaction has no separate witness serialization.',
      },
      { label: 'Raw size', value: '226 bytes' },
      { label: 'Virtual size', value: '226 vbytes' },
      { label: 'Weight', value: '904 WU' },
    ],
    contextFields: [],
    references: [
      {
        label: 'Open input 0',
        detail: 'Legacy scriptSig',
        fixtureId: 'legacy-input',
        route: `/display/transaction/${LEGACY_TXID}/input/0`,
      },
      {
        label: 'Open output 0',
        detail: '829.66947065 BTC · P2PKH',
        fixtureId: 'legacy-output',
        route: `/display/transaction/${LEGACY_TXID}/output/0`,
      },
    ],
    fullPageRoute: `/display/transaction/${LEGACY_TXID}`,
  },
  {
    id: 'p2wpkh-input',
    kind: 'tx-input',
    typeLabel: 'TxIn',
    identifier: `${P2WPKH_TXID}:0`,
    rawHex: p2wpkhInputHex,
    rawLabel: 'Serialized TxIn',
    fields: [
      field(
        'previous-txid',
        'Previous txid',
        P2WPKH_PREVIOUS_TXID,
        p2wpkhInputHex.slice(0, 64),
        0,
        'Transaction containing the output this input spends.',
        'bitcoin',
      ),
      field(
        'vout',
        'Previous output index (vout)',
        '0',
        '00000000',
        32,
        'Zero-based output index in the previous transaction.',
      ),
      field(
        'script-sig-size',
        'scriptSig size',
        '0 bytes',
        '00',
        36,
        'Native SegWit leaves scriptSig empty.',
      ),
      {
        id: 'script-sig',
        label: 'scriptSig',
        value: 'Empty',
        rawHex: '',
        range: { offset: 37, length: 0 },
        description: 'No unlocking script bytes are serialized for this native P2WPKH input.',
        tone: 'script',
      },
      field(
        'sequence',
        'Sequence',
        '4294967295',
        'ffffffff',
        37,
        'This sequence value disables relative locktime.',
      ),
    ],
    derivedFields: [
      {
        label: 'Format',
        value: 'Native P2WPKH',
        description: 'Witness-based pay-to-public-key-hash input.',
      },
      {
        label: 'Serialized size',
        value: '41 bytes',
        description: 'The witness is serialized elsewhere in the transaction.',
      },
      {
        label: 'Unlocking data',
        value: '2 witness items',
        description: 'A signature and public key are associated with this input.',
      },
    ],
    contextFields: [
      {
        label: 'Witness stack',
        value: '2 items · 72-byte signature · 33-byte public key',
        description: `Associated transaction bytes: ${p2wpkhWitnessHex}`,
      },
      {
        label: 'Witness placement',
        value: 'Serialized separately after all outputs',
        description:
          'Witness belongs to this input semantically, but it is not part of the serialized TxIn bytes shown above.',
      },
      {
        label: 'Previous-output amount',
        value: '1,083,200 sats · 0.01083200 BTC',
        description: 'Required BIP143 signing context; not serialized in this input.',
      },
      {
        label: 'Previous scriptPubKey',
        value: '0014841b80d2cc75f5345c482af96294d04fdd66b2b7',
        description:
          'Native P2WPKH locking script from the spent output; not serialized in this input.',
      },
    ],
    references: [
      {
        label: 'Open owning transaction',
        detail: `${P2WPKH_TXID.slice(0, 12)}…${P2WPKH_TXID.slice(-8)}`,
        fixtureId: 'p2wpkh-transaction',
        route: `/display/transaction/${P2WPKH_TXID}`,
      },
    ],
    fullPageRoute: `/display/transaction/${P2WPKH_TXID}/input/0`,
  },
  {
    id: 'legacy-input',
    kind: 'tx-input',
    typeLabel: 'TxIn',
    identifier: `${LEGACY_TXID}:0`,
    rawHex: LEGACY_TRANSACTION_HEX.slice(10, 306),
    rawLabel: 'Serialized TxIn',
    fields: [
      field(
        'previous-txid',
        'Previous txid',
        '0b6461de422c46a221db99608fcbe0326e4f2325ebf2a47c9faf660ed61ee6a4',
        LEGACY_TRANSACTION_HEX.slice(10, 74),
        0,
        'Transaction containing the output this input spends.',
        'bitcoin',
      ),
      field(
        'vout',
        'Previous output index (vout)',
        '1',
        '01000000',
        32,
        'Zero-based output index in the previous transaction.',
      ),
      field(
        'script-sig-size',
        'scriptSig size',
        '107 bytes',
        '6b',
        36,
        'CompactSize length of the unlocking script.',
      ),
      field(
        'script-sig',
        'scriptSig',
        'ECDSA signature + compressed public key',
        LEGACY_TRANSACTION_HEX.slice(84, 298),
        37,
        'Legacy unlocking data serialized directly inside this input.',
        'script',
      ),
      field(
        'sequence',
        'Sequence',
        '4294967294 · relative locktime disabled',
        'feffffff',
        144,
        'Sequence value for this input.',
      ),
    ],
    derivedFields: [
      {
        label: 'Format',
        value: 'Legacy P2PKH',
        description: 'Classic pay-to-public-key-hash input.',
      },
      {
        label: 'Serialized size',
        value: '148 bytes',
        description: 'Includes the scriptSig inside the TxIn.',
      },
      {
        label: 'Unlocking data',
        value: '107-byte scriptSig',
        description: 'Contains the signature and public key.',
      },
    ],
    contextFields: [
      {
        label: 'Previous-output amount',
        value: '82,974,043,165 sats · 829.74043165 BTC',
        description: 'Value of output 1 in the previous transaction; not serialized in this input.',
      },
      {
        label: 'Previous scriptPubKey',
        value: '76a91455ae51684c43435da751ac8d2173b2652eb6410588ac',
        description: 'P2PKH locking script from the spent output; not serialized in this input.',
      },
    ],
    references: [
      {
        label: 'Open owning transaction',
        detail: `${LEGACY_TXID.slice(0, 12)}…${LEGACY_TXID.slice(-8)}`,
        fixtureId: 'legacy-transaction',
        route: `/display/transaction/${LEGACY_TXID}`,
      },
    ],
    fullPageRoute: `/display/transaction/${LEGACY_TXID}/input/0`,
  },
  {
    id: 'legacy-output',
    kind: 'tx-output',
    typeLabel: 'TxOut',
    identifier: `${LEGACY_TXID}:0`,
    rawHex: LEGACY_TRANSACTION_HEX.slice(308, 376),
    rawLabel: 'Serialized TxOut',
    fields: [
      field(
        'amount',
        'Amount',
        '82,966,947,065 sats · 829.66947065 BTC',
        'f924375113000000',
        0,
        'Unsigned 64-bit little-endian satoshi amount.',
        'bitcoin',
      ),
      field(
        'script-pubkey-size',
        'scriptPubKey size',
        '25 bytes',
        '19',
        8,
        'CompactSize length of the locking script.',
      ),
      field(
        'script-pubkey',
        'scriptPubKey',
        'OP_DUP OP_HASH160 0c4435…2831ac OP_EQUALVERIFY OP_CHECKSIG',
        LEGACY_TRANSACTION_HEX.slice(326, 376),
        9,
        'Standard P2PKH locking script.',
        'script',
      ),
    ],
    derivedFields: [
      {
        label: 'Script classification',
        value: 'P2PKH',
        description: 'Recognized standard locking pattern.',
      },
      {
        label: 'Serialized size',
        value: '34 bytes',
        description: 'Eight value bytes, one length byte, and a 25-byte locking script.',
      },
    ],
    contextFields: [],
    references: [
      {
        label: 'Open owning transaction',
        detail: `${LEGACY_TXID.slice(0, 12)}…${LEGACY_TXID.slice(-8)}`,
        fixtureId: 'legacy-transaction',
        route: `/display/transaction/${LEGACY_TXID}`,
      },
    ],
    fullPageRoute: `/display/transaction/${LEGACY_TXID}/output/0`,
  },
  {
    id: 'genesis-transaction',
    kind: 'transaction',
    typeLabel: 'Transaction',
    identifier: GENESIS_TXID,
    rawHex: GENESIS_BLOCK_HEX.slice(162),
    rawLabel: 'Complete serialized transaction',
    fields: [
      field('version', 'Version', '1', '01000000', 0, 'Transaction format version.'),
      field('input-count', 'Input count', '1', '01', 4, 'Coinbase input count.'),
      field(
        'input-0-coinbase-outpoint',
        'Coinbase outpoint',
        `${'0'.repeat(64)}:4294967295`,
        `${'00'.repeat(32)}ffffffff`,
        5,
        'Null outpoint marks a coinbase input.',
        'bitcoin',
      ),
      field(
        'input-0-script-sig-size',
        'Input 0 · scriptSig size',
        '77 bytes',
        '4d',
        41,
        'Length of the coinbase script.',
      ),
      field(
        'input-0-script-sig',
        'Input 0 · scriptSig',
        'Difficulty · extra nonce · “The Times 03/Jan/2009…”',
        GENESIS_BLOCK_HEX.slice(246, 400),
        42,
        'Coinbase data includes the well-known newspaper headline.',
        'script',
      ),
      field(
        'input-0-sequence',
        'Input 0 · sequence',
        '4294967295 · final',
        'ffffffff',
        119,
        'Coinbase input sequence.',
      ),
      field('output-count', 'Output count', '1', '01', 123, 'One created output.'),
      field(
        'output-0-amount',
        'Output 0 · amount',
        '5,000,000,000 sats · 50.00000000 BTC',
        '00f2052a01000000',
        124,
        'Genesis subsidy amount.',
        'bitcoin',
      ),
      field(
        'output-0-script-size',
        'Output 0 · scriptPubKey size',
        '67 bytes',
        '43',
        132,
        'Length of the locking script.',
      ),
      field(
        'output-0-script-pubkey',
        'Output 0 · scriptPubKey',
        'Pay-to-public-key · uncompressed key',
        GENESIS_BLOCK_HEX.slice(428, 562),
        133,
        'Pushes Satoshi’s public key then checks its signature.',
        'script',
      ),
      field('locktime', 'Locktime', '0 · disabled', '00000000', 200, 'No absolute locktime.'),
    ],
    derivedFields: [
      { label: 'Witness transaction ID', value: GENESIS_TXID },
      { label: 'Raw size', value: '204 bytes' },
      { label: 'Virtual size', value: '204 vbytes' },
      { label: 'Weight', value: '816 WU' },
    ],
    contextFields: [
      {
        label: 'Block',
        value: `${GENESIS_BLOCK_HASH} · height 0`,
        description: 'Chain context, not transaction serialization.',
      },
    ],
    references: [],
    fullPageRoute: `/display/transaction/${GENESIS_TXID}`,
  },
  {
    id: 'p2wpkh-transaction',
    kind: 'transaction',
    typeLabel: 'Transaction',
    identifier: P2WPKH_TXID,
    rawHex: P2WPKH_TRANSACTION_HEX,
    rawLabel: 'Complete serialized transaction',
    fields: [
      field('version', 'Version', '2', '02000000', 0, 'Transaction format version.'),
      field(
        'marker-flag',
        'SegWit marker and flag',
        '00 01',
        '0001',
        4,
        'Announces witness serialization.',
        'witness',
      ),
      field('input-count', 'Input count', '1', '01', 6, 'CompactSize number of inputs.'),
      field(
        'input-0',
        'Input 0',
        `${P2WPKH_PREVIOUS_TXID}:0`,
        p2wpkhInputHex,
        7,
        'Serialized input with an empty scriptSig.',
      ),
      field('output-count', 'Output count', '1', '01', 48, 'CompactSize number of outputs.'),
      field(
        'output-0',
        'Output 0',
        '1,068,340 sats · native P2WPKH',
        P2WPKH_TRANSACTION_HEX.slice(98, 160),
        49,
        'Created native P2WPKH output.',
        'script',
      ),
      field(
        'witness-count',
        'Input 0 · witness item count',
        '2',
        '02',
        80,
        'Two witness stack items.',
        'witness',
      ),
      field(
        'witness-signature-size',
        'Input 0 · signature size',
        '72 bytes',
        '48',
        81,
        'Length of the ECDSA signature and sighash byte.',
        'witness',
      ),
      field(
        'witness-signature',
        'Input 0 · signature',
        'DER ECDSA signature · SIGHASH_ALL',
        P2WPKH_TRANSACTION_HEX.slice(164, 308),
        82,
        'Witness signature for input 0.',
        'witness',
      ),
      field(
        'witness-key-size',
        'Input 0 · public key size',
        '33 bytes',
        '21',
        154,
        'Length of the compressed public key.',
        'witness',
      ),
      field(
        'witness-key',
        'Input 0 · public key',
        'Compressed public key',
        P2WPKH_TRANSACTION_HEX.slice(310, 376),
        155,
        'Witness public key for input 0.',
        'witness',
      ),
      field('locktime', 'Locktime', '0 · disabled', '00000000', 188, 'No absolute locktime.'),
    ],
    derivedFields: [
      { label: 'Witness transaction ID', value: P2WPKH_WTXID },
      { label: 'Raw size', value: '192 bytes' },
      { label: 'Virtual size', value: '110 vbytes' },
      { label: 'Weight', value: '438 WU' },
    ],
    contextFields: [],
    references: [
      {
        label: 'Open input 0',
        detail: 'Witness context',
        fixtureId: 'p2wpkh-input',
        route: `/display/transaction/${P2WPKH_TXID}/input/0`,
      },
    ],
    fullPageRoute: `/display/transaction/${P2WPKH_TXID}`,
  },
];

export const BITCOIN_OBJECT_FIXTURES = Object.freeze(fixtures);

export function fixtureForKind(kind: BitcoinObjectKind): BitcoinObjectFixture {
  return BITCOIN_OBJECT_FIXTURES.find((fixture) => fixture.kind === kind)!;
}

export function fixtureById(id: string): BitcoinObjectFixture | undefined {
  return BITCOIN_OBJECT_FIXTURES.find((fixture) => fixture.id === id);
}

export function fixtureForRoute(
  kind: 'block' | 'transaction' | 'tx-input' | 'tx-output',
  identifier: string,
  index?: number,
): BitcoinObjectFixture | undefined {
  const normalized = identifier.toLowerCase();
  if (kind === 'block' && normalized === GENESIS_BLOCK_HASH) return fixtureById('genesis-block');
  if (kind === 'transaction' && normalized === LEGACY_TXID)
    return fixtureById('legacy-transaction');
  if (kind === 'transaction' && normalized === GENESIS_TXID)
    return fixtureById('genesis-transaction');
  if (kind === 'transaction' && normalized === P2WPKH_TXID)
    return fixtureById('p2wpkh-transaction');
  if (kind === 'tx-input' && normalized === P2WPKH_TXID && index === 0)
    return fixtureById('p2wpkh-input');
  if (kind === 'tx-input' && normalized === LEGACY_TXID && index === 0)
    return fixtureById('legacy-input');
  if (kind === 'tx-output' && normalized === LEGACY_TXID && index === 0)
    return fixtureById('legacy-output');
  return undefined;
}
