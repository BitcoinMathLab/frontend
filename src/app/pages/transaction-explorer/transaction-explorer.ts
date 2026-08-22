import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TransactionContextResponse } from '../../core/trace-api.models';

const TXID_PATTERN = /^[0-9a-fA-F]{64}$/;

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

  protected txid = '40e331b67c0fe7750bb3b1943b378bf702dce86124dc12fa5980f975db7ec930';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<TransactionContextResponse | null>(null);

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
  }

  protected formatSats(amount: number): string {
    return new Intl.NumberFormat('en-CA').format(amount);
  }

  protected byteCount(transactionHex: string): number {
    return transactionHex.length / 2;
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
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
