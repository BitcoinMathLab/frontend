import {
  decodeTransactionBytes,
  describeTransactionByteField,
  TransactionDecodeError,
} from './transaction-byte-decoder';

const LEGACY_TRANSACTION =
  '01000000' +
  '01' +
  '00'.repeat(32) +
  'ffffffff' +
  '00' +
  'ffffffff' +
  '01' +
  'e803000000000000' +
  '01' +
  '51' +
  '00000000';

const SEGWIT_TRANSACTION =
  '02000000' +
  '0001' +
  '01' +
  '11'.repeat(32) +
  '00000000' +
  '00' +
  'feffffff' +
  '01' +
  'e803000000000000' +
  '01' +
  '51' +
  '02' +
  '01aa' +
  '02bbcc' +
  '00000000';

const HISTORICAL_LEGACY_TRANSACTION =
  '0100000001032e38e9c0a84c6046d687d10556dcacc41d275ec55fc00779ac88fdf357a187000000008c493046022100c352d3dd993a981beba4a63ad15c209275ca9470abfcd57da93b58e4eb5dce82022100840792bc1f456062819f15d33ee7055cf7b5ee1af1ebcc6028d9cdb1c3af7748014104f46db5e9d61a9dc27b8d64ad23e7383a4e6ca164593c2527c038c0857eb67ee8e825dca65046b82c9331586c82e0fd1f633f25f87c161bc6f8a630121df2b3d3ffffffff0200e32321000000001976a914c398efa9c392ba6013c5e04ee729755ef7f58b3288ac000fe208010000001976a914948c765a6914d43f2a7ac177da2c2f6b52de3d7c88ac00000000';

const HISTORICAL_SEGWIT_TRANSACTION =
  '02000000000101e725fc6dd7b74dbd0f94d7a4bc0ac71a3566d18042d517420dbfe6694516e8400000000000fdffffff01709d2f000000000017a91431653bfcbd2d8a93ee62b7694ae0bfd613f2d953870247304402205740b607af851297e23ed71b87beaedf940b24d700b6cc028e298b2116fd1a3202202d50cb3e1225d6d6b22ad7943b8babea91cd6a505d568ea6e068f96b9ee611a6012103d9771001b46fc01e1dfe54c0ca03cdb83b103a0b35ad6de6558fdb9c62b0a4d200000000';

describe('decodeTransactionBytes', () => {
  it('maps every byte in a legacy transaction to an explained field', () => {
    const fields = decodeTransactionBytes(LEGACY_TRANSACTION);

    expect(fields[0]).toMatchObject({
      id: 'version',
      offset: 0,
      length: 4,
      hex: '01000000',
      decoded: '1',
    });
    expect(fields.find((field) => field.id === 'input-count')?.decoded).toBe('1');
    expect(fields.find((field) => field.id === 'output-0-amount')?.decoded).toBe('1000 sats');
    expect(fields.find((field) => field.id === 'input-0-vout')?.decoded).toBe(
      '4294967295 (coinbase marker)',
    );
    expect(fields.find((field) => field.id === 'input-0-sequence')?.decoded).toBe(
      '4294967295 (final)',
    );
    expect(fields.at(-1)).toMatchObject({ id: 'locktime', decoded: '0 (disabled)' });
    expect(fields.reduce((total, field) => total + field.length, 0)).toBe(
      LEGACY_TRANSACTION.length / 2,
    );
  });

  it('decodes the historical legacy payment/change transaction without gaps', () => {
    const fields = decodeTransactionBytes(HISTORICAL_LEGACY_TRANSACTION);

    expect(fields.find((field) => field.id === 'input-count')?.decoded).toBe('1');
    expect(fields.find((field) => field.id === 'output-count')?.decoded).toBe('2');
    expect(fields.find((field) => field.id === 'output-0-amount')?.decoded).toBe('556000000 sats');
    expect(fields.find((field) => field.id === 'output-1-amount')?.decoded).toBe('4444000000 sats');
    expect(fields.find((field) => field.id === 'output-0-script-pubkey')?.decoded).toBe(
      '25 bytes (P2PKH locking script)',
    );
    expect(fields.reduce((total, field) => total + field.length, 0)).toBe(259);
  });

  it('decodes the historical native SegWit fixture without gaps', () => {
    const fields = decodeTransactionBytes(HISTORICAL_SEGWIT_TRANSACTION);

    expect(fields.find((field) => field.id === 'marker-flag')).toBeDefined();
    expect(fields.find((field) => field.id === 'input-0-witness-count')?.decoded).toBe('2');
    expect(fields.find((field) => field.id === 'output-0-script-pubkey')?.decoded).toBe(
      '23 bytes (P2SH locking script)',
    );
    expect(fields.reduce((total, field) => total + field.length, 0)).toBe(192);
  });

  it('rejects non-canonical CompactSize integers', () => {
    const nonCanonicalInputCount = `${LEGACY_TRANSACTION.slice(0, 8)}fd0100${LEGACY_TRANSACTION.slice(10)}`;

    expect(() => decodeTransactionBytes(nonCanonicalInputCount)).toThrow(
      /non-canonical CompactSize/,
    );
  });

  it('provides explanations for engine-produced field identifiers', () => {
    expect(describeTransactionByteField({ id: 'input-0-previous-txid' })).toContain(
      'Transaction ID',
    );
    expect(describeTransactionByteField({ id: 'output-1-script-pubkey' })).toContain(
      'Locking script',
    );
    expect(describeTransactionByteField({ id: 'input-0-witness-1' })).toContain('witness stack');
  });

  it('decodes marker, flag, and witness stacks without losing byte offsets', () => {
    const fields = decodeTransactionBytes(SEGWIT_TRANSACTION);

    expect(fields.find((field) => field.id === 'marker-flag')).toMatchObject({
      offset: 4,
      hex: '0001',
      decoded: 'Witness serialization',
    });
    expect(fields.find((field) => field.id === 'input-0-witness-count')?.decoded).toBe('2');
    expect(fields.find((field) => field.id === 'input-0-witness-1')).toMatchObject({
      hex: 'bbcc',
      decoded: '2 bytes',
    });
    expect(fields.reduce((total, field) => total + field.length, 0)).toBe(
      SEGWIT_TRANSACTION.length / 2,
    );
  });

  it.each(['', '0', 'zz', LEGACY_TRANSACTION.slice(0, -2), `${LEGACY_TRANSACTION}00`])(
    'rejects malformed or incomplete transaction hex %s',
    (transactionHex) => {
      expect(() => decodeTransactionBytes(transactionHex)).toThrow(TransactionDecodeError);
    },
  );
});
