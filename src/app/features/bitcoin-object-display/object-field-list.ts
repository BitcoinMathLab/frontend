import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import { BitcoinDisplayItem, BitcoinObjectReference } from './bitcoin-object-display.models';

@Component({
  selector: 'app-object-field-list',
  templateUrl: './object-field-list.html',
  styleUrl: './object-field-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectFieldList {
  protected readonly transactionPageSize = 5;
  readonly items = input.required<readonly BitcoinDisplayItem[]>();
  readonly selectedItemId = input.required<string>();
  readonly selected = output<BitcoinDisplayItem>();
  readonly referenceOpened = output<BitcoinObjectReference>();
  protected readonly transactionSearch = signal('');
  protected readonly transactionPage = signal(0);
  protected readonly transactionMembers = computed(
    () => this.items().find((item) => item.collectionKind === 'transactions')?.children ?? [],
  );
  protected readonly filteredTransactions = computed(() => {
    const query = this.transactionSearch().trim().toLowerCase();
    if (!query) return this.transactionMembers();
    return this.transactionMembers().filter(
      (transaction) =>
        transaction.value.toLowerCase().includes(query) ||
        transaction.label.toLowerCase().includes(query),
    );
  });
  protected readonly transactionPageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredTransactions().length / this.transactionPageSize)),
  );
  protected readonly pagedTransactions = computed(() => {
    const first = this.transactionPage() * this.transactionPageSize;
    return this.filteredTransactions().slice(first, first + this.transactionPageSize);
  });

  constructor() {
    effect(() => {
      this.items();
      this.transactionSearch.set('');
      this.transactionPage.set(0);
    });
  }

  protected searchTransactions(event: Event): void {
    this.transactionSearch.set((event.target as HTMLInputElement).value);
    this.transactionPage.set(0);
  }

  protected previousTransactionPage(): void {
    this.transactionPage.update((page) => Math.max(0, page - 1));
  }

  protected nextTransactionPage(): void {
    this.transactionPage.update((page) => Math.min(this.transactionPageCount() - 1, page + 1));
  }

  protected openTransaction(item: BitcoinDisplayItem): void {
    if (item.reference) {
      this.referenceOpened.emit(item.reference);
      return;
    }
    this.selected.emit(item);
  }
}
