import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { CURATED_P2PKH_REQUEST } from '../../core/curated-p2pkh';
import { TraceApi } from '../../core/trace-api';
import { P2pkhTraceRequest, P2pkhTraceResponse } from '../../core/trace-api.models';
import { TracePlayer } from '../../features/trace-player/trace-player';

@Component({
  selector: 'app-script-visualizer',
  imports: [FormsModule, TracePlayer],
  templateUrl: './script-visualizer.html',
  styleUrl: './script-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptVisualizer implements OnInit, OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private readonly route = inject(ActivatedRoute);
  private requestSubscription: Subscription | undefined;

  protected readonly response = signal<P2pkhTraceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly activeWorkspace = signal<'execution' | 'signature'>('execution');
  protected readonly signatureStage = signal<'message' | 'hash' | 'verify'>('message');
  protected transactionId = '';
  protected inputIndex = 0;

  ngOnInit(): void {
    const txid = this.route.snapshot.queryParamMap.get('txid');
    const inputIndex = Number(this.route.snapshot.queryParamMap.get('input') ?? '0');
    this.transactionId = txid ?? '';
    this.inputIndex = Number.isSafeInteger(inputIndex) && inputIndex >= 0 ? inputIndex : 0;
    txid && Number.isSafeInteger(inputIndex) && inputIndex >= 0
      ? this.loadTransactionTrace(txid, inputIndex)
      : this.loadTrace();
  }

  protected loadSelectedInput(): void {
    const txid = this.transactionId.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
      this.response.set(null);
      this.error.set('Enter a transaction ID containing exactly 64 hexadecimal characters.');
      return;
    }
    if (!Number.isSafeInteger(this.inputIndex) || this.inputIndex < 0) {
      this.response.set(null);
      this.error.set('Enter a transaction input index of zero or greater.');
      return;
    }
    this.loadTransactionTrace(txid.toLowerCase(), this.inputIndex);
  }

  protected loadTrace(): void {
    this.loadRequest(CURATED_P2PKH_REQUEST);
  }

  protected retry(): void {
    const txid = this.transactionId.trim();
    txid && Number.isSafeInteger(this.inputIndex) && this.inputIndex >= 0
      ? this.loadTransactionTrace(txid, this.inputIndex)
      : this.loadTrace();
  }

  private loadTransactionTrace(txid: string, inputIndex: number): void {
    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    if (!/^[0-9a-fA-F]{64}$/.test(txid)) {
      this.loading.set(false);
      this.error.set('The transaction ID in this visualizer link is invalid.');
      return;
    }
    this.requestSubscription = this.traceApi.loadTransactionContext(txid).subscribe({
      next: (context) => {
        const selectedOutput = context.spent_outputs[inputIndex];
        if (!selectedOutput) {
          this.loading.set(false);
          this.error.set('The selected transaction input does not exist.');
          return;
        }
        if (selectedOutput.spend_type !== 'P2PKH') {
          this.loading.set(false);
          this.error.set('The selected input is not a legacy P2PKH spend.');
          return;
        }
        this.loadRequest({
          transaction_hex: context.transaction_hex,
          input_index: inputIndex,
          spent_outputs: context.spent_outputs.map((output) => ({
            amount_sats: output.amount_sats,
            script_pubkey_hex: output.script_pubkey_hex,
          })),
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Bitcoin Core could not load the selected transaction.');
      },
    });
  }

  private loadRequest(request: P2pkhTraceRequest): void {
    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.requestSubscription = this.traceApi
      .loadP2pkhTrace(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set('The selected spend could not be traced.'),
      });
  }

  protected showWorkspace(workspace: 'execution' | 'signature'): void {
    this.activeWorkspace.set(workspace);
  }

  protected handleWorkspaceKeydown(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const workspace = event.key === 'ArrowLeft' || event.key === 'Home' ? 'execution' : 'signature';
    const tablist = event.currentTarget as HTMLElement;
    this.showWorkspace(workspace);
    queueMicrotask(() => {
      const tabs = tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs[workspace === 'execution' ? 0 : 1]?.focus();
    });
  }

  protected selectSignatureStage(stage: 'message' | 'hash' | 'verify'): void {
    this.signatureStage.set(stage);
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }
}
