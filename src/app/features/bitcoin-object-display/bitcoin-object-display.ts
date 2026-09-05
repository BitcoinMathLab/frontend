import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import {
  BitcoinDisplayItem,
  BitcoinObjectField,
  BitcoinObjectFixture,
  BitcoinObjectReference,
} from './bitcoin-object-display.models';
import { ObjectCopyButton } from './object-copy-button';
import { ObjectFieldList } from './object-field-list';
import { ObjectReference } from './object-reference';

@Component({
  selector: 'app-bitcoin-object-display',
  imports: [ObjectCopyButton, ObjectFieldList, ObjectReference],
  templateUrl: './bitcoin-object-display.html',
  styleUrl: './bitcoin-object-display.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BitcoinObjectDisplay {
  readonly fixture = input.required<BitcoinObjectFixture>();
  readonly compact = input(false);
  readonly referenceOpened = output<BitcoinObjectReference>();
  protected readonly selectedItem = signal<BitcoinDisplayItem | null>(null);
  protected readonly identifierItem = computed<BitcoinDisplayItem | null>(() => {
    const fixture = this.fixture();
    if (fixture.kind !== 'block' && fixture.kind !== 'transaction') return null;
    const isBlock = fixture.kind === 'block';
    return {
      id: 'object-identifier',
      label: isBlock ? 'Block ID' : 'Transaction ID',
      value: fixture.identifier,
      description: isBlock
        ? 'The block ID identifies this block in the blockchain. It is the double SHA-256 hash of the 80-byte block header, shown in conventional display order.'
        : 'The transaction ID identifies this transaction. It is derived from the transaction serialization and shown in conventional display order.',
      source: 'derived',
    };
  });
  protected readonly orderedItems = computed<readonly BitcoinDisplayItem[]>(() => {
    const fields = this.fixture().fields;
    const consumed = new Set<string>();
    const items: BitcoinDisplayItem[] = [];

    for (const field of fields) {
      if (consumed.has(field.id)) continue;
      const collection = this.collectionFor(field.id);
      if (!collection) {
        items.push(this.serializedItem(field));
        continue;
      }

      const members = new Map<number, BitcoinObjectField[]>();
      const memberPattern = new RegExp(`^${collection.prefix}-(\\d+)(?:-|$)`);
      for (const candidate of fields) {
        const match = candidate.id.match(memberPattern);
        if (!match) continue;
        const index = Number(match[1]);
        const group = members.get(index) ?? [];
        group.push(candidate);
        members.set(index, group);
        consumed.add(candidate.id);
      }

      items.push({
        ...this.serializedItem(field),
        label: collection.label,
        value: `${field.value} ${Number(field.value) === 1 ? collection.singular : collection.label.toLowerCase()}`,
        collectionKind: collection.kind,
        children: [...members.entries()].map(([index, memberFields]) =>
          this.collectionMember(collection.singular, collection.prefix, index, memberFields),
        ),
      });
    }
    const identifier = this.identifierItem();
    return identifier ? [identifier, ...items] : items;
  });
  protected readonly initialItem = computed<BitcoinDisplayItem>(() => {
    const item = this.orderedItems()[0];
    if (!item) throw new Error('Bitcoin object displays require at least one field.');
    return item;
  });
  protected readonly standaloneReferences = computed(() => {
    const collectionRoutes = new Set(
      this.orderedItems().flatMap((item) =>
        (item.children ?? []).flatMap((member) =>
          member.reference ? [member.reference.route] : [],
        ),
      ),
    );
    return this.fixture().references.filter((reference) => !collectionRoutes.has(reference.route));
  });
  protected readonly overviewItems = computed(() => [
    ...this.fixture().derivedFields,
    ...this.fixture().contextFields,
  ]);

  constructor() {
    effect(() => {
      this.fixture();
      this.selectedItem.set(null);
    });
  }

  protected selectItem(item: BitcoinDisplayItem): void {
    if (item.id === this.initialItem().id) {
      this.selectedItem.set(null);
      return;
    }
    this.selectedItem.set(this.selectedItem()?.id === item.id ? null : item);
  }

  private serializedItem(field: BitcoinObjectField): BitcoinDisplayItem {
    return { ...field, source: 'serialized' };
  }

  private collectionFor(id: string): {
    prefix: string;
    label: string;
    singular: string;
    kind: 'transactions' | 'inputs' | 'outputs';
  } | null {
    if (id === 'transaction-count') {
      return {
        prefix: 'transaction',
        label: 'Transactions',
        singular: 'Transaction',
        kind: 'transactions',
      };
    }
    if (id === 'input-count') {
      return { prefix: 'input', label: 'Inputs', singular: 'TxIn', kind: 'inputs' };
    }
    if (id === 'output-count') {
      return { prefix: 'output', label: 'Outputs', singular: 'TxOut', kind: 'outputs' };
    }
    return null;
  }

  private collectionMember(
    singular: string,
    prefix: string,
    index: number,
    fields: BitcoinObjectField[],
  ): BitcoinDisplayItem {
    const start = Math.min(
      ...fields.map((field) => field.range?.offset ?? Number.MAX_SAFE_INTEGER),
    );
    const end = Math.max(
      ...fields.map((field) => (field.range?.offset ?? 0) + (field.range?.length ?? 0)),
    );
    const primary =
      fields.find((field) => field.id === `${prefix}-${index}`) ??
      fields.find((field) => field.id.endsWith('-amount')) ??
      fields.find((field) => field.id.endsWith('-previous-txid')) ??
      fields[0];
    const reference =
      fields.find((field) => field.reference)?.reference ??
      this.fixture().references.find((candidate) =>
        candidate.route.endsWith(`/${prefix === 'transaction' ? 'transaction' : prefix}/${index}`),
      ) ??
      this.fixture().references.find((candidate) =>
        candidate.label.toLowerCase().includes(`${prefix} ${index}`),
      );

    return {
      id: `${prefix}-${index}-object`,
      label: `${singular} ${index}`,
      value: primary.value,
      description: `${singular} ${index} and its fields, kept together in serialized order.`,
      source: 'serialized',
      rawHex:
        start === Number.MAX_SAFE_INTEGER
          ? undefined
          : this.fixture().rawHex.slice(start * 2, end * 2),
      range: start === Number.MAX_SAFE_INTEGER ? undefined : { offset: start, length: end - start },
      tone: primary.tone,
      children: fields.map((field) => this.serializedItem(field)),
      reference,
    };
  }
}
