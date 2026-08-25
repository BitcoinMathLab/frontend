export type TransactionByteGroup = 'header' | 'input' | 'output' | 'witness' | 'footer';

export interface TransactionByteField {
  readonly id: string;
  readonly label: string;
  readonly group: TransactionByteGroup;
  readonly offset: number;
  readonly length: number;
  readonly hex: string;
  readonly decoded: string;
  readonly description: string;
}

export class TransactionDecodeError extends Error {}

const DESCRIPTIONS = {
  version: 'Selects the transaction serialization and validation rules.',
  markerFlag: 'The 00 01 marker and flag announce witness data later in the transaction.',
  inputCount: 'CompactSize integer giving the number of transaction inputs.',
  previousTxid:
    'Transaction ID containing the output referenced by this input, serialized least-significant byte first.',
  previousVout: 'Zero-based output index inside the previous transaction.',
  scriptLength: 'CompactSize length of the script that follows.',
  scriptSig:
    'Unlocking script supplied by a legacy input. Native SegWit inputs usually leave this empty.',
  sequence: 'Input sequence value used by relative locktime and transaction replacement rules.',
  outputCount: 'CompactSize integer giving the number of outputs created by this transaction.',
  amount: 'Output value serialized as an unsigned 64-bit little-endian satoshi amount.',
  scriptPubkey: 'Locking script that defines how this newly created output may be spent.',
  witnessCount: 'CompactSize number of witness stack items for this input.',
  witnessItem: 'One length-prefixed item in the input witness stack.',
  locktime:
    'Earliest block height or time at which this transaction may be included, when enabled by input sequence.',
} as const;

class Decoder {
  private readonly bytes: Uint8Array;
  private cursor = 0;
  private readonly fields: TransactionByteField[] = [];

  constructor(private readonly normalizedHex: string) {
    if (!/^(?:[0-9a-f]{2})+$/.test(normalizedHex)) {
      throw new TransactionDecodeError('Transaction hex must contain complete lowercase bytes.');
    }
    this.bytes = Uint8Array.from(normalizedHex.match(/../g) ?? [], (byte) =>
      Number.parseInt(byte, 16),
    );
  }

  decode(): readonly TransactionByteField[] {
    this.fixed('version', 'Version', 'header', 4, DESCRIPTIONS.version, true);
    const isSegwit =
      this.remaining() >= 2 && this.bytes[this.cursor] === 0 && this.bytes[this.cursor + 1] !== 0;
    if (isSegwit) {
      this.fixed(
        'marker-flag',
        'SegWit marker and flag',
        'header',
        2,
        DESCRIPTIONS.markerFlag,
        false,
        'Witness serialization',
      );
    }

    const inputCount = this.compactSize(
      'input-count',
      'Input count',
      'header',
      DESCRIPTIONS.inputCount,
    );
    this.assertCollectionSize(inputCount, 'input');
    for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
      const displayIndex = inputIndex + 1;
      const txid = this.fixed(
        `input-${inputIndex}-previous-txid`,
        `Input ${displayIndex} previous txid`,
        'input',
        32,
        DESCRIPTIONS.previousTxid,
      );
      this.replaceDecoded(txid.id, reverseHexBytes(txid.hex));
      const previousVout = this.fixed(
        `input-${inputIndex}-vout`,
        `Input ${displayIndex} previous output index`,
        'input',
        4,
        DESCRIPTIONS.previousVout,
        true,
      );
      if (/^0+$/.test(txid.hex) && previousVout.decoded === '4294967295') {
        this.replaceDecoded(previousVout.id, '4294967295 (coinbase marker)');
      }
      const scriptLength = this.compactSize(
        `input-${inputIndex}-script-length`,
        `Input ${displayIndex} scriptSig length`,
        'input',
        DESCRIPTIONS.scriptLength,
      );
      if (scriptLength > 0) {
        this.fixed(
          `input-${inputIndex}-script-sig`,
          `Input ${displayIndex} scriptSig`,
          'input',
          scriptLength,
          DESCRIPTIONS.scriptSig,
          false,
          `${scriptLength} bytes`,
        );
      }
      const sequence = this.fixed(
        `input-${inputIndex}-sequence`,
        `Input ${displayIndex} sequence`,
        'input',
        4,
        DESCRIPTIONS.sequence,
        true,
      );
      this.replaceDecoded(sequence.id, describeSequence(Number(sequence.decoded)));
    }

    const outputCount = this.compactSize(
      'output-count',
      'Output count',
      'header',
      DESCRIPTIONS.outputCount,
    );
    this.assertCollectionSize(outputCount, 'output');
    for (let outputIndex = 0; outputIndex < outputCount; outputIndex += 1) {
      const displayIndex = outputIndex + 1;
      this.fixed(
        `output-${outputIndex}-amount`,
        `Output ${displayIndex} amount`,
        'output',
        8,
        DESCRIPTIONS.amount,
        true,
        undefined,
        ' sats',
      );
      const scriptLength = this.compactSize(
        `output-${outputIndex}-script-length`,
        `Output ${displayIndex} locking-script length`,
        'output',
        DESCRIPTIONS.scriptLength,
      );
      if (scriptLength > 0) {
        const lockingScript = this.fixed(
          `output-${outputIndex}-script-pubkey`,
          `Output ${displayIndex} locking script`,
          'output',
          scriptLength,
          DESCRIPTIONS.scriptPubkey,
          false,
          `${scriptLength} bytes`,
        );
        this.replaceDecoded(lockingScript.id, describeLockingScript(lockingScript.hex));
      }
    }

    if (isSegwit) {
      for (let inputIndex = 0; inputIndex < inputCount; inputIndex += 1) {
        const displayIndex = inputIndex + 1;
        const itemCount = this.compactSize(
          `input-${inputIndex}-witness-count`,
          `Input ${displayIndex} witness item count`,
          'witness',
          DESCRIPTIONS.witnessCount,
        );
        this.assertCollectionSize(itemCount, 'witness item');
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex += 1) {
          const itemLength = this.compactSize(
            `input-${inputIndex}-witness-${itemIndex}-length`,
            `Input ${displayIndex} witness item ${itemIndex + 1} length`,
            'witness',
            DESCRIPTIONS.scriptLength,
          );
          if (itemLength > 0) {
            this.fixed(
              `input-${inputIndex}-witness-${itemIndex}`,
              `Input ${displayIndex} witness item ${itemIndex + 1}`,
              'witness',
              itemLength,
              DESCRIPTIONS.witnessItem,
              false,
              `${itemLength} bytes`,
            );
          }
        }
      }
    }

    const locktime = this.fixed('locktime', 'Locktime', 'footer', 4, DESCRIPTIONS.locktime, true);
    this.replaceDecoded(locktime.id, describeLocktime(Number(locktime.decoded)));
    if (this.cursor !== this.bytes.length) {
      throw new TransactionDecodeError(`Unexpected data begins at byte ${this.cursor}.`);
    }
    return this.fields;
  }

  private fixed(
    id: string,
    label: string,
    group: TransactionByteGroup,
    length: number,
    description: string,
    decodeInteger = false,
    decoded?: string,
    suffix = '',
  ): TransactionByteField {
    const offset = this.cursor;
    this.require(length);
    const bytes = this.bytes.slice(offset, offset + length);
    this.cursor += length;
    const field: TransactionByteField = {
      id,
      label,
      group,
      offset,
      length,
      hex: this.normalizedHex.slice(offset * 2, this.cursor * 2),
      decoded:
        decoded ?? (decodeInteger ? `${unsignedLittleEndian(bytes)}${suffix}` : `${length} bytes`),
      description,
    };
    this.fields.push(field);
    return field;
  }

  private compactSize(
    id: string,
    label: string,
    group: TransactionByteGroup,
    description: string,
  ): number {
    const start = this.cursor;
    this.require(1);
    const prefix = this.bytes[this.cursor];
    this.cursor += 1;
    const payloadLength = prefix < 0xfd ? 0 : prefix === 0xfd ? 2 : prefix === 0xfe ? 4 : 8;
    this.require(payloadLength);
    const value =
      payloadLength === 0
        ? BigInt(prefix)
        : unsignedLittleEndian(this.bytes.slice(this.cursor, this.cursor + payloadLength));
    this.cursor += payloadLength;
    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new TransactionDecodeError(`${label} exceeds the supported safe integer range.`);
    }
    const numericValue = Number(value);
    if (
      (prefix === 0xfd && value < 0xfdn) ||
      (prefix === 0xfe && value <= 0xffffn) ||
      (prefix === 0xff && value <= 0xffffffffn)
    ) {
      throw new TransactionDecodeError(`${label} uses a non-canonical CompactSize encoding.`);
    }
    this.fields.push({
      id,
      label,
      group,
      offset: start,
      length: this.cursor - start,
      hex: this.normalizedHex.slice(start * 2, this.cursor * 2),
      decoded: `${numericValue}`,
      description,
    });
    return numericValue;
  }

  private replaceDecoded(id: string, decoded: string): void {
    const index = this.fields.findIndex((field) => field.id === id);
    this.fields[index] = { ...this.fields[index], decoded };
  }

  private assertCollectionSize(count: number, name: string): void {
    if (count > this.remaining()) {
      throw new TransactionDecodeError(
        `Declared ${name} count exceeds the remaining transaction bytes.`,
      );
    }
  }

  private require(length: number): void {
    if (length < 0 || this.cursor + length > this.bytes.length) {
      throw new TransactionDecodeError(`Transaction ended unexpectedly at byte ${this.cursor}.`);
    }
  }

  private remaining(): number {
    return this.bytes.length - this.cursor;
  }
}

export function decodeTransactionBytes(transactionHex: string): readonly TransactionByteField[] {
  return new Decoder(transactionHex.trim().toLowerCase()).decode();
}

export function describeTransactionByteField(field: Pick<TransactionByteField, 'id'>): string {
  if (field.id === 'version') return DESCRIPTIONS.version;
  if (field.id === 'marker-flag') return DESCRIPTIONS.markerFlag;
  if (field.id === 'input-count') return DESCRIPTIONS.inputCount;
  if (field.id === 'output-count') return DESCRIPTIONS.outputCount;
  if (field.id === 'locktime') return DESCRIPTIONS.locktime;
  if (field.id.endsWith('-previous-txid')) return DESCRIPTIONS.previousTxid;
  if (field.id.endsWith('-vout')) return DESCRIPTIONS.previousVout;
  if (field.id.endsWith('-script-length') || field.id.endsWith('-length')) {
    return DESCRIPTIONS.scriptLength;
  }
  if (field.id.endsWith('-script-sig')) return DESCRIPTIONS.scriptSig;
  if (field.id.endsWith('-sequence')) return DESCRIPTIONS.sequence;
  if (field.id.endsWith('-amount')) return DESCRIPTIONS.amount;
  if (field.id.endsWith('-script-pubkey')) return DESCRIPTIONS.scriptPubkey;
  if (field.id.endsWith('-witness-count')) return DESCRIPTIONS.witnessCount;
  if (/witness-\d+$/.test(field.id)) return DESCRIPTIONS.witnessItem;
  return 'A canonical field in the serialized Bitcoin transaction.';
}

function unsignedLittleEndian(bytes: Uint8Array): bigint {
  let value = 0n;
  for (let index = bytes.length - 1; index >= 0; index -= 1) {
    value = (value << 8n) | BigInt(bytes[index]);
  }
  return value;
}

function reverseHexBytes(hex: string): string {
  return (hex.match(/../g) ?? []).reverse().join('');
}

function describeSequence(sequence: number): string {
  if (sequence === 0xffffffff) {
    return `${sequence} (final)`;
  }
  if ((sequence & 0x80000000) !== 0) {
    return `${sequence} (relative locktime disabled)`;
  }
  const value = sequence & 0xffff;
  return (sequence & 0x00400000) !== 0
    ? `${sequence} (${value} × 512 seconds relative locktime)`
    : `${sequence} (${value} block relative locktime)`;
}

function describeLocktime(locktime: number): string {
  if (locktime === 0) {
    return '0 (disabled)';
  }
  return locktime < 500_000_000 ? `${locktime} (block height)` : `${locktime} (Unix timestamp)`;
}

function describeLockingScript(scriptHex: string): string {
  if (/^76a914[0-9a-f]{40}88ac$/.test(scriptHex)) {
    return `${scriptHex.length / 2} bytes (P2PKH locking script)`;
  }
  if (/^a914[0-9a-f]{40}87$/.test(scriptHex)) {
    return `${scriptHex.length / 2} bytes (P2SH locking script)`;
  }
  if (/^0014[0-9a-f]{40}$/.test(scriptHex)) {
    return `${scriptHex.length / 2} bytes (P2WPKH witness program)`;
  }
  if (/^0020[0-9a-f]{64}$/.test(scriptHex)) {
    return `${scriptHex.length / 2} bytes (P2WSH witness program)`;
  }
  if (/^5120[0-9a-f]{64}$/.test(scriptHex)) {
    return `${scriptHex.length / 2} bytes (P2TR witness program)`;
  }
  return `${scriptHex.length / 2} bytes (nonstandard or unrecognized locking script)`;
}
