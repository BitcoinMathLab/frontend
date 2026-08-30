import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { CURATED_P2PKH_REQUEST } from '../../core/curated-p2pkh';
import { TraceApi } from '../../core/trace-api';
import {
  P2pkhTraceRequest,
  SpendTraceResponse,
  PreviousOutputContext,
  TraceScripts,
  TraceSources,
} from '../../core/trace-api.models';
import { SignaturePlayer } from '../../features/signature-player/signature-player';
import { TracePlayer } from '../../features/trace-player/trace-player';

interface ContextSpend {
  readonly txid: string;
  readonly inputIndex: number;
  readonly transactionHex: string;
  readonly signatureFamily: string;
  readonly spendType: string;
  readonly unlockingLabel: 'scriptSig' | 'witness';
  readonly unlockingItems: readonly string[];
  readonly scriptPubkeyHex: string;
  readonly previousTxid: string;
  readonly previousVout: number;
}

@Component({
  selector: 'app-script-visualizer',
  imports: [FormsModule, SignaturePlayer, TracePlayer],
  templateUrl: './script-visualizer.html',
  styleUrl: './script-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptVisualizer implements OnInit, OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private readonly route = inject(ActivatedRoute);
  private requestSubscription: Subscription | undefined;

  protected readonly response = signal<SpendTraceResponse | null>(null);
  protected readonly contextSpend = signal<ContextSpend | null>(null);
  protected readonly transactionHex = signal(CURATED_P2PKH_REQUEST.transaction_hex);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly activeWorkspace = signal<'execution' | 'signature'>('execution');
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
    this.response.set(null);
    this.contextSpend.set(null);
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
        if (selectedOutput.spend_type !== 'P2PKH' && selectedOutput.spend_type !== 'P2WPKH') {
          this.contextSpend.set(
            this.toContextSpend(context.transaction_hex, txid, inputIndex, selectedOutput),
          );
          this.activeWorkspace.set('signature');
          this.loading.set(false);
          return;
        }
        if (selectedOutput.spend_type === 'P2WPKH') this.activeWorkspace.set('signature');
        this.loadRequest(
          {
            transaction_hex: context.transaction_hex,
            input_index: inputIndex,
            spent_outputs: context.spent_outputs.map((output) => ({
              amount_sats: output.amount_sats,
              script_pubkey_hex: output.script_pubkey_hex,
            })),
          },
          selectedOutput.spend_type,
        );
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Bitcoin Core could not load the selected transaction.');
      },
    });
  }

  private loadRequest(request: P2pkhTraceRequest, scriptType: 'P2PKH' | 'P2WPKH' = 'P2PKH'): void {
    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set('');
    this.contextSpend.set(null);
    this.transactionHex.set(request.transaction_hex);
    const traceRequest: Observable<SpendTraceResponse> =
      scriptType === 'P2WPKH'
        ? this.traceApi.loadP2wpkhTrace(request)
        : this.traceApi.loadP2pkhTrace(request);
    this.requestSubscription = traceRequest
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set('The selected spend could not be traced.'),
      });
  }

  protected showWorkspace(workspace: 'execution' | 'signature'): void {
    this.activeWorkspace.set(workspace);
  }

  protected displayScripts(result: SpendTraceResponse): TraceScripts {
    return result.script_type === 'P2PKH'
      ? result.scripts
      : {
          unlocking: '',
          locking: result.scripts.script_code,
          combined: result.scripts.script_code,
        };
  }

  protected displaySources(result: SpendTraceResponse): TraceSources {
    return result.script_type === 'P2PKH'
      ? result.sources
      : { script_sig: result.sources.witness, script_pubkey: result.sources.script_pubkey };
  }

  protected witnessItems(result: SpendTraceResponse): readonly string[] {
    return result.script_type === 'P2WPKH' ? result.scripts.witness : [];
  }

  private toContextSpend(
    transactionHex: string,
    txid: string,
    inputIndex: number,
    output: PreviousOutputContext,
  ): ContextSpend {
    const isTaproot = output.spend_type.startsWith('P2TR');
    const isWitness =
      output.spend_type.includes('WPKH') || output.spend_type.includes('WSH') || isTaproot;
    return {
      txid,
      inputIndex,
      transactionHex,
      signatureFamily: isTaproot ? 'Taproot Schnorr' : isWitness ? 'SegWit ECDSA' : 'Legacy ECDSA',
      spendType: output.spend_type,
      unlockingLabel: isWitness ? 'witness' : 'scriptSig',
      unlockingItems: isWitness
        ? (output.witness_hex ?? [])
        : output.script_sig_hex
          ? [output.script_sig_hex]
          : [],
      scriptPubkeyHex: output.script_pubkey_hex,
      previousTxid: output.txid,
      previousVout: output.vout,
    };
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

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }
}
