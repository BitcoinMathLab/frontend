import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TransactionContextResponse } from '../../core/trace-api.models';

const TXID_PATTERN = /^[0-9a-fA-F]{64}$/;
const EXAMPLE_TXIDS = Object.freeze([
  '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930',
  'ed25927576988e38e4cc8e4b19d1272c480f113fb605271b190df05aa983714e',
  '242b2de161deac31f77238b898e85a5e4760c5aa004ede2e2cc355202f84e6aa',
  '62ff4bde640c3fb09faa1223dc7ccc7b11baacb7043fb22f7f328bc2a4cd496b',
]);

@Component({
  selector: 'app-transaction-explorer',
  imports: [FormsModule],
  templateUrl: './transaction-explorer.html',
  styleUrl: './transaction-explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionExplorer implements OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private requestSubscription: Subscription | undefined;
  private copiedTimeout: ReturnType<typeof setTimeout> | undefined;

  protected txid = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<TransactionContextResponse | null>(null);
  protected readonly copied = signal(false);

  protected lookup(): void {
    const txid = this.txid.trim();
    this.txid = txid;
    this.error.set('');

    if (!TXID_PATTERN.test(txid)) {
      this.result.set(null);
      this.error.set('Enter a transaction ID containing exactly 64 hexadecimal characters.');
      return;
    }

    this.requestSubscription?.unsubscribe();
    this.result.set(null);
    this.loading.set(true);
    this.requestSubscription = this.traceApi
      .loadTransactionContext(txid.toLowerCase())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.result.set(response),
        error: (error: HttpErrorResponse) => this.error.set(this.messageFor(error)),
      });
  }

  protected clear(): void {
    this.requestSubscription?.unsubscribe();
    this.txid = '';
    this.loading.set(false);
    this.error.set('');
    this.result.set(null);
    this.copied.set(false);
  }

  protected async copy(): Promise<void> {
    if (!navigator.clipboard) {
      this.error.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(this.txid.trim());
      this.copied.set(true);
      clearTimeout(this.copiedTimeout);
      this.copiedTimeout = setTimeout(() => this.copied.set(false), 1_500);
    } catch {
      this.error.set('The transaction ID could not be copied to the clipboard.');
    }
  }

  protected async paste(): Promise<void> {
    if (!navigator.clipboard) {
      this.error.set('Clipboard access is not available in this browser.');
      return;
    }
    try {
      this.replaceInput((await navigator.clipboard.readText()).trim());
    } catch {
      this.error.set('Clipboard permission was denied. Paste into the field directly instead.');
    }
  }

  protected random(): void {
    const candidates = EXAMPLE_TXIDS.filter((txid) => txid !== this.txid.trim().toLowerCase());
    this.replaceInput(
      candidates[Math.floor(Math.random() * candidates.length)] ?? EXAMPLE_TXIDS[0],
    );
  }

  protected formatSats(amount: number): string {
    return new Intl.NumberFormat('en-CA').format(amount);
  }

  protected byteCount(transactionHex: string): number {
    return transactionHex.length / 2;
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    clearTimeout(this.copiedTimeout);
  }

  private replaceInput(txid: string): void {
    this.requestSubscription?.unsubscribe();
    this.txid = txid;
    this.loading.set(false);
    this.error.set('');
    this.result.set(null);
    this.copied.set(false);
  }

  private messageFor(error: HttpErrorResponse): string {
    if (error.status === 422) {
      return 'That transaction ID is not valid. Check all 64 hexadecimal characters.';
    }
    if (error.status === 503) {
      return 'Bitcoin Core is still catching up or unavailable. Try this transaction again later.';
    }
    return 'The transaction could not be loaded. Check the ID and try again.';
  }
}
