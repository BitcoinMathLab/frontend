import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { CURATED_P2PKH_REQUEST } from '../../core/curated-p2pkh';
import { TraceApi } from '../../core/trace-api';
import { P2pkhTraceResponse } from '../../core/trace-api.models';
import { TracePlayer } from '../../features/trace-player/trace-player';
import { decodeTransactionBytes } from '../transaction-explorer/transaction-byte-decoder';

const transactionFields = decodeTransactionBytes(CURATED_P2PKH_REQUEST.transaction_hex);
const previousTxid = transactionFields.find((field) => field.id === 'input-0-previous-txid');
const previousVout = transactionFields.find((field) => field.id === 'input-0-vout');

@Component({
  selector: 'app-script-visualizer',
  imports: [TracePlayer],
  templateUrl: './script-visualizer.html',
  styleUrl: './script-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptVisualizer implements OnInit, OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private requestSubscription: Subscription | undefined;

  protected readonly response = signal<P2pkhTraceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly outpoint = {
    txid: previousTxid?.decoded ?? 'Unavailable',
    vout: previousVout?.decoded ?? 'Unavailable',
  };
  protected readonly spentOutput = CURATED_P2PKH_REQUEST.spent_outputs[0];

  ngOnInit(): void {
    this.loadTrace();
  }

  protected loadTrace(): void {
    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.requestSubscription = this.traceApi
      .loadP2pkhTrace(CURATED_P2PKH_REQUEST)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set(true),
      });
  }

  protected formatSats(amount: number): string {
    return new Intl.NumberFormat('en-CA').format(amount);
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }
}
