import { BitcoinObjectFixture } from '../bitcoin-object-display/bitcoin-object-display.models';

interface TxInFixtureSource {
  readonly spendingTxid: string;
  readonly inputIndex: number;
  readonly previousTxid: string;
  readonly previousVout: number;
  readonly scriptSig: string;
  readonly sequence: string;
  readonly scriptType: 'P2PKH' | 'P2WPKH' | 'P2MS';
  readonly witnessItems: readonly string[];
}

interface TxOutFixtureSource {
  readonly transactionTxid: string;
  readonly outputIndex: number;
  readonly amountSats: number | null;
  readonly scriptPubKey: string;
  readonly scriptType: 'P2PKH' | 'P2WPKH' | 'P2MS';
}

export function txInPreparationFixture(source: TxInFixtureSource): BitcoinObjectFixture {
  const scriptSize = source.scriptSig.length / 2;
  const scriptSizeHex = compactSize(scriptSize);
  const previousTxidHex = reverseBytes(source.previousTxid);
  const voutHex = unsignedLittleEndian(BigInt(source.previousVout), 4);
  const sequenceValue = sequenceNumber(source.sequence);
  const sequenceHex = unsignedLittleEndian(sequenceValue, 4);
  const scriptOffset = 36 + scriptSizeHex.length / 2;
  const sequenceOffset = scriptOffset + scriptSize;
  const rawHex = previousTxidHex + voutHex + scriptSizeHex + source.scriptSig + sequenceHex;

  return {
    id: `trace-input-${source.spendingTxid}-${source.inputIndex}`,
    kind: 'tx-input',
    typeLabel: 'TxIn',
    identifier: `${source.spendingTxid}:${source.inputIndex}`,
    rawHex,
    rawLabel: 'Serialized TxIn',
    fields: [
      {
        id: 'previous-txid',
        label: 'Previous txid',
        value: source.previousTxid,
        rawHex: previousTxidHex,
        range: { offset: 0, length: 32 },
        description: 'Transaction containing the output this input spends.',
        tone: 'bitcoin',
      },
      {
        id: 'vout',
        label: 'Previous output index (vout)',
        value: String(source.previousVout),
        rawHex: voutHex,
        range: { offset: 32, length: 4 },
        description: 'Zero-based output index in the previous transaction.',
      },
      {
        id: 'script-sig-size',
        label: 'scriptSig size',
        value: `${scriptSize} ${scriptSize === 1 ? 'byte' : 'bytes'}`,
        rawHex: scriptSizeHex,
        range: { offset: 36, length: scriptSizeHex.length / 2 },
        description: 'CompactSize length of the unlocking script.',
      },
      {
        id: 'script-sig',
        label: 'scriptSig',
        value: source.scriptSig || 'Empty',
        rawHex: source.scriptSig,
        range: { offset: scriptOffset, length: scriptSize },
        description:
          source.scriptType === 'P2WPKH'
            ? 'Native SegWit keeps its unlocking data in the witness, leaving scriptSig empty.'
            : 'Unlocking script serialized inside this input.',
        tone: 'script',
      },
      {
        id: 'sequence',
        label: 'Sequence',
        value: source.sequence,
        rawHex: sequenceHex,
        range: { offset: sequenceOffset, length: 4 },
        description: 'Sequence value for this input.',
      },
    ],
    derivedFields: [
      {
        label: 'Format',
        value: source.scriptType === 'P2WPKH' ? 'Native P2WPKH' : source.scriptType,
      },
      { label: 'Serialized size', value: `${rawHex.length / 2} bytes` },
    ],
    contextFields:
      source.scriptType === 'P2WPKH'
        ? [
            {
              label: 'Witness stack',
              value: `${source.witnessItems.length} ${source.witnessItems.length === 1 ? 'item' : 'items'}`,
              description: 'Associated unlocking data serialized outside the TxIn.',
            },
          ]
        : [],
    references: [
      {
        label: 'Open owning transaction',
        detail: `${source.spendingTxid.slice(0, 12)}…${source.spendingTxid.slice(-8)}`,
        fixtureId: '',
        route: `/display/transaction/${source.spendingTxid}`,
        openInNewTab: true,
      },
    ],
    fullPageRoute: `/display/transaction/${source.spendingTxid}/input/${source.inputIndex}`,
  };
}

export function txOutPreparationFixture(source: TxOutFixtureSource): BitcoinObjectFixture {
  const scriptSize = source.scriptPubKey.length / 2;
  const scriptSizeHex = compactSize(scriptSize);
  const hasAmount = source.amountSats !== null;
  const amountHex = hasAmount ? unsignedLittleEndian(BigInt(source.amountSats!), 8) : '';
  const rawHex = hasAmount ? amountHex + scriptSizeHex + source.scriptPubKey : '';
  const amountValue = hasAmount
    ? `${new Intl.NumberFormat('en-CA').format(source.amountSats!)} sats · ${(source.amountSats! / 100_000_000).toFixed(8)} BTC`
    : 'Unavailable';

  return {
    id: `trace-output-${source.transactionTxid}-${source.outputIndex}`,
    kind: 'tx-output',
    typeLabel: 'TxOut',
    identifier: `${source.transactionTxid}:${source.outputIndex}`,
    rawHex,
    rawLabel: hasAmount ? 'Serialized TxOut' : 'Serialized TxOut unavailable',
    fields: [
      {
        id: 'amount',
        label: 'Amount',
        value: amountValue,
        rawHex: amountHex || undefined,
        range: hasAmount ? { offset: 0, length: 8 } : undefined,
        description: hasAmount
          ? 'Unsigned 64-bit little-endian satoshi amount.'
          : 'The amount was not supplied with this trace.',
        tone: 'bitcoin',
      },
      {
        id: 'script-pubkey-size',
        label: 'scriptPubKey size',
        value: `${scriptSize} ${scriptSize === 1 ? 'byte' : 'bytes'}`,
        rawHex: scriptSizeHex,
        range: hasAmount ? { offset: 8, length: scriptSizeHex.length / 2 } : undefined,
        description: 'CompactSize length of the locking script.',
      },
      {
        id: 'script-pubkey',
        label: 'scriptPubKey',
        value: source.scriptPubKey,
        rawHex: source.scriptPubKey,
        range: hasAmount ? { offset: 8 + scriptSizeHex.length / 2, length: scriptSize } : undefined,
        description: 'Locking condition carried by the referenced output.',
        tone: 'script',
      },
    ],
    derivedFields: [
      { label: 'Script classification', value: source.scriptType },
      ...(hasAmount ? [{ label: 'Serialized size', value: `${rawHex.length / 2} bytes` }] : []),
    ],
    contextFields: [],
    references: [
      {
        label: 'Open owning transaction',
        detail: `${source.transactionTxid.slice(0, 12)}…${source.transactionTxid.slice(-8)}`,
        fixtureId: '',
        route: `/display/transaction/${source.transactionTxid}`,
        openInNewTab: true,
      },
    ],
    fullPageRoute: `/display/transaction/${source.transactionTxid}/output/${source.outputIndex}`,
  };
}

function sequenceNumber(displayValue: string): bigint {
  const match = displayValue.match(/^\s*(\d+)/);
  return match ? BigInt(match[1]) : 0n;
}

function reverseBytes(hex: string): string {
  return hex.match(/../g)?.reverse().join('') ?? '';
}

function unsignedLittleEndian(value: bigint, bytes: number): string {
  let remaining = value;
  let result = '';
  for (let index = 0; index < bytes; index += 1) {
    result += Number(remaining & 0xffn)
      .toString(16)
      .padStart(2, '0');
    remaining >>= 8n;
  }
  return result;
}

function compactSize(value: number): string {
  if (value < 0xfd) return value.toString(16).padStart(2, '0');
  if (value <= 0xffff) return `fd${unsignedLittleEndian(BigInt(value), 2)}`;
  if (value <= 0xffffffff) return `fe${unsignedLittleEndian(BigInt(value), 4)}`;
  return `ff${unsignedLittleEndian(BigInt(value), 8)}`;
}
