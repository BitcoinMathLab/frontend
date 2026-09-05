import { BitcoinObjectFixture, BitcoinObjectKind } from '../features/bitcoin-object-display/bitcoin-object-display.models';

const STORAGE_PREFIX = 'bitcoin-math-lab:object-display:';

export function saveTransientObjectFixture(fixture: BitcoinObjectFixture): void {
  try {
    localStorage.setItem(storageKey(fixture.kind, fixture.identifier), JSON.stringify(fixture));
  } catch {
    // The durable route can still show its normal unavailable state when storage is disabled.
  }
}

export function transientObjectFixture(
  kind: BitcoinObjectKind,
  identifier: string,
): BitcoinObjectFixture | undefined {
  try {
    const stored = localStorage.getItem(storageKey(kind, identifier));
    if (!stored) return undefined;
    const fixture = JSON.parse(stored) as BitcoinObjectFixture;
    return fixture.kind === kind && fixture.identifier.toLowerCase() === identifier.toLowerCase()
      ? fixture
      : undefined;
  } catch {
    return undefined;
  }
}

function storageKey(kind: BitcoinObjectKind, identifier: string): string {
  return `${STORAGE_PREFIX}${kind}:${identifier.toLowerCase()}`;
}
