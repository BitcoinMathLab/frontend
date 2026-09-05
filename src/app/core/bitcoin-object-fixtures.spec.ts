import {
  BITCOIN_OBJECT_FIXTURES,
  GENESIS_BLOCK_HASH,
  LEGACY_TXID,
  P2WPKH_TRANSACTION_HEX,
  P2WPKH_TXID,
  P2WPKH_WTXID,
  fixtureById,
  fixtureForKind,
  fixtureForRoute,
} from './bitcoin-object-fixtures';

async function hash256(hex: string): Promise<string> {
  const bytes = Uint8Array.from(hex.match(/../g) ?? [], (byte) => Number.parseInt(byte, 16));
  const first = await crypto.subtle.digest('SHA-256', bytes);
  const second = await crypto.subtle.digest('SHA-256', first);
  return [...new Uint8Array(second)]
    .reverse()
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

describe('Bitcoin object fixtures', () => {
  it('covers every serialized byte exactly once and keeps field hex aligned', () => {
    for (const fixture of BITCOIN_OBJECT_FIXTURES) {
      let cursor = 0;
      for (const field of fixture.fields) {
        if (!field.range || field.range.length === 0) continue;
        expect(field.range.offset, `${fixture.id}:${field.id} offset`).toBe(cursor);
        expect(field.rawHex?.length, `${fixture.id}:${field.id} length`).toBe(
          field.range.length * 2,
        );
        expect(
          fixture.rawHex.slice(cursor * 2, (cursor + field.range.length) * 2),
          `${fixture.id}:${field.id} bytes`,
        ).toBe(field.rawHex);
        cursor += field.range.length;
      }
      expect(cursor, `${fixture.id} coverage`).toBe(fixture.rawHex.length / 2);
    }
  });

  it('cryptographically verifies block, legacy txid, txid, and wtxid identifiers', async () => {
    expect(await hash256(fixtureById('genesis-block')!.rawHex.slice(0, 160))).toBe(
      GENESIS_BLOCK_HASH,
    );
    expect(await hash256(fixtureById('legacy-transaction')!.rawHex)).toBe(LEGACY_TXID);
    expect(await hash256(P2WPKH_TRANSACTION_HEX)).toBe(P2WPKH_WTXID);

    const strippedP2wpkh =
      P2WPKH_TRANSACTION_HEX.slice(0, 8) +
      P2WPKH_TRANSACTION_HEX.slice(12, 160) +
      P2WPKH_TRANSACTION_HEX.slice(376);
    expect(await hash256(strippedP2wpkh)).toBe(P2WPKH_TXID);
  });

  it('resolves each showroom kind and supported durable route without putting hex in URLs', () => {
    expect(
      (['block', 'transaction', 'tx-input', 'tx-output'] as const).map((kind) =>
        fixtureForKind(kind),
      ),
    ).toEqual([
      fixtureById('genesis-block'),
      fixtureById('legacy-transaction'),
      fixtureById('p2wpkh-input'),
      fixtureById('legacy-output'),
    ]);
    expect(fixtureForRoute('block', GENESIS_BLOCK_HASH)?.id).toBe('genesis-block');
    expect(fixtureForRoute('tx-input', P2WPKH_TXID, 0)?.id).toBe('p2wpkh-input');
    expect(
      BITCOIN_OBJECT_FIXTURES.every((fixture) => !fixture.fullPageRoute.includes(fixture.rawHex)),
    ).toBe(true);
  });
});
