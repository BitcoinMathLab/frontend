import { TestBed } from '@angular/core/testing';

import { BitcoinDisplayItem, BitcoinObjectReference } from './bitcoin-object-display.models';
import { ObjectFieldList } from './object-field-list';

describe('ObjectFieldList', () => {
  it('searches and paginates large transaction collections without expanding transaction fields', () => {
    const fixture = TestBed.createComponent(ObjectFieldList);
    const transactions: BitcoinDisplayItem[] = Array.from({ length: 7 }, (_, index) => ({
      id: `transaction-${index}-object`,
      label: `Transaction ${index}`,
      value: `txid-${index}`,
      description: `Transaction ${index}`,
      source: 'serialized',
      children: [
        {
          id: `transaction-${index}`,
          label: `Transaction ${index} bytes`,
          value: `txid-${index}`,
          description: 'Serialized transaction',
          source: 'serialized',
        },
      ],
      reference: {
        label: `Open transaction ${index}`,
        detail: `txid-${index}`,
        fixtureId: `transaction-${index}`,
        route: `/display/transaction/txid-${index}`,
      },
    }));
    fixture.componentRef.setInput('items', [
      {
        id: 'transaction-count',
        label: 'Transactions',
        value: '7 transactions',
        description: 'Transaction count',
        source: 'serialized',
        collectionKind: 'transactions',
        children: transactions,
      } satisfies BitcoinDisplayItem,
    ]);
    fixture.componentRef.setInput('selectedItemId', '');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLDetailsElement>('.field--collection')!.open = true;
    fixture.detectChanges();

    expect(element.querySelectorAll('.transaction-card')).toHaveLength(5);
    expect(element.querySelector('.collection__member')).toBeNull();
    element.querySelectorAll<HTMLButtonElement>('.transaction-pages button')[1].click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.transaction-card')).toHaveLength(2);

    const search = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    search.value = 'txid-6';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.transaction-card')).toHaveLength(1);

    let opened: BitcoinObjectReference | undefined;
    fixture.componentInstance.referenceOpened.subscribe((reference) => (opened = reference));
    element.querySelector<HTMLButtonElement>('.transaction-card')!.click();
    expect(opened?.fixtureId).toBe('transaction-6');
  });
});
