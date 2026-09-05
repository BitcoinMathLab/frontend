export type BitcoinObjectKind = 'block' | 'transaction' | 'tx-input' | 'tx-output';

export type BitcoinFieldTone = 'bitcoin' | 'script' | 'neutral' | 'witness';

export interface BitcoinByteRange {
  readonly offset: number;
  readonly length: number;
}

export interface BitcoinObjectReference {
  readonly label: string;
  readonly detail: string;
  readonly fixtureId: string;
  readonly route: string;
  readonly openInNewTab?: boolean;
}

export interface BitcoinObjectField {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly rawHex?: string;
  readonly description: string;
  readonly range?: BitcoinByteRange;
  readonly tone?: BitcoinFieldTone;
  readonly reference?: BitcoinObjectReference;
}

export interface BitcoinContextField {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
}

export type BitcoinInformationSource = 'derived' | 'serialized' | 'context';

export interface BitcoinDisplayItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly description: string;
  readonly source: BitcoinInformationSource;
  readonly rawHex?: string;
  readonly range?: BitcoinByteRange;
  readonly tone?: BitcoinFieldTone;
  readonly children?: readonly BitcoinDisplayItem[];
  readonly reference?: BitcoinObjectReference;
  readonly collectionKind?: 'transactions' | 'inputs' | 'outputs';
}

export interface BitcoinObjectFixture {
  readonly id: string;
  readonly kind: BitcoinObjectKind;
  readonly typeLabel: string;
  readonly identifier: string;
  readonly rawHex: string;
  readonly rawLabel: string;
  readonly rawDisclosureLabel?: string;
  readonly fields: readonly BitcoinObjectField[];
  readonly derivedFields: readonly BitcoinContextField[];
  readonly contextFields: readonly BitcoinContextField[];
  readonly references: readonly BitcoinObjectReference[];
  readonly fullPageRoute: string;
}

export const BITCOIN_OBJECT_KINDS: readonly {
  kind: BitcoinObjectKind;
  label: string;
}[] = [
  { kind: 'block', label: 'Block' },
  { kind: 'transaction', label: 'Transaction' },
  { kind: 'tx-input', label: 'TxIn' },
  { kind: 'tx-output', label: 'TxOut' },
];
