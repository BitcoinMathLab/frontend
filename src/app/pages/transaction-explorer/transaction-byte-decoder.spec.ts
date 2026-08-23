import { decodeTransactionBytes, TransactionDecodeError } from './transaction-byte-decoder';

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
    expect(fields.at(-1)).toMatchObject({ id: 'locktime', decoded: '0' });
    expect(fields.reduce((total, field) => total + field.length, 0)).toBe(
      LEGACY_TRANSACTION.length / 2,
    );
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
