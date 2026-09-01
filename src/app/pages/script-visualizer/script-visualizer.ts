import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, finalize, Observable, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import { CURATED_P2PKH_REQUEST } from '../../core/curated-p2pkh';
import { TraceApi } from '../../core/trace-api';
import {
  EcdsaSignatureVerificationResponse,
  P2pkhTraceRequest,
  SpendTraceResponse,
  SignatureWalkthroughResult,
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
  private verificationSubscription: Subscription | undefined;

  protected readonly response = signal<SpendTraceResponse | null>(null);
  protected readonly contextSpend = signal<ContextSpend | null>(null);
  protected readonly verificationResponse = signal<EcdsaSignatureVerificationResponse | null>(null);
  protected readonly verificationTransactionHex = signal('');
  protected readonly verifying = signal(false);
  protected readonly verificationError = signal('');
  protected readonly transactionHex = signal(CURATED_P2PKH_REQUEST.transaction_hex);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly activeWorkspace = signal<'execution' | 'signature'>('execution');
  protected transactionId = '';
  protected inputIndex = 0;
  protected verifierTransactionId = '';
  protected verifierInputIndex = 0;
  protected derSignature = '';

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
        next: (response) => {
          this.response.set(response);
          this.populateVerifier(response);
        },
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

  protected verifySignature(): void {
    const txid = this.verifierTransactionId.trim().toLowerCase();
    const signature = this.derSignature.trim().toLowerCase();
    this.verificationError.set('');
    if (!/^[0-9a-f]{64}$/.test(txid)) {
      this.verificationError.set(
        'Enter a transaction ID containing exactly 64 hexadecimal characters.',
      );
      return;
    }
    if (!Number.isSafeInteger(this.verifierInputIndex) || this.verifierInputIndex < 0) {
      this.verificationError.set('Enter a transaction input index of zero or greater.');
      return;
    }
    if (!/^(?:[0-9a-f]{2}){8,72}$/.test(signature)) {
      this.verificationError.set('Enter 8 to 72 bytes of DER signature as hexadecimal.');
      return;
    }

    this.verificationSubscription?.unsubscribe();
    this.verifying.set(true);
    this.verificationResponse.set(null);
    this.verificationSubscription = this.traceApi
      .loadTransactionContext(txid)
      .pipe(
        switchMap((context) => {
          const selectedOutput = context.spent_outputs[this.verifierInputIndex];
          if (!selectedOutput) {
            this.verificationError.set('The selected transaction input does not exist.');
            return EMPTY;
          }
          if (selectedOutput.spend_type !== 'P2PKH' && selectedOutput.spend_type !== 'P2WPKH') {
            this.verificationError.set(
              `DER ECDSA verification is not available for ${selectedOutput.spend_type}.`,
            );
            return EMPTY;
          }
          this.verificationTransactionHex.set(context.transaction_hex);
          return this.traceApi.verifyEcdsaSignature({
            transaction_hex: context.transaction_hex,
            input_index: this.verifierInputIndex,
            spent_outputs: context.spent_outputs.map((output) => ({
              amount_sats: output.amount_sats,
              script_pubkey_hex: output.script_pubkey_hex,
            })),
            der_signature_hex: signature,
          });
        }),
        finalize(() => this.verifying.set(false)),
      )
      .subscribe({
        next: (response) => this.verificationResponse.set(response),
        error: () =>
          this.verificationError.set(
            'The DER signature or its verified transaction context could not be checked.',
          ),
      });
  }

  protected signatureResult(result: SpendTraceResponse): SignatureWalkthroughResult {
    return this.verificationResponse() ?? result;
  }

  protected signatureTransaction(resultTransactionHex: string): string {
    return this.verificationResponse() ? this.verificationTransactionHex() : resultTransactionHex;
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
    this.verificationSubscription?.unsubscribe();
  }

  private populateVerifier(response: SpendTraceResponse): void {
    const sources = response.sources;
    this.verifierTransactionId =
      'witness' in sources ? sources.witness.transaction_txid : sources.script_sig.transaction_txid;
    this.verifierInputIndex = response.input_index;
    this.derSignature = response.signature.signature_hex;
    this.verificationResponse.set(null);
    this.verificationTransactionHex.set('');
    this.verificationError.set('');
  }
}
