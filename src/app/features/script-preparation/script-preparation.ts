import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';

import { fixtureById, fixtureForRoute } from '../../core/bitcoin-object-fixtures';
import { TraceScripts, TraceSources } from '../../core/trace-api.models';
import {
  BitcoinObjectFixture,
  BitcoinObjectReference,
} from '../bitcoin-object-display/bitcoin-object-display.models';
import { BitcoinObjectModal } from '../bitcoin-object-display/bitcoin-object-modal';
import { txInPreparationFixture, txOutPreparationFixture } from './script-preparation-fixtures';

@Component({
  selector: 'app-script-preparation',
  imports: [BitcoinObjectModal],
  templateUrl: './script-preparation.html',
  styleUrl: './script-preparation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptPreparation implements OnDestroy {
  readonly stage = input.required<0 | 1>();
  readonly scripts = input.required<TraceScripts>();
  readonly sources = input.required<TraceSources>();
  readonly scriptType = input.required<'P2PKH' | 'P2WPKH' | 'P2MS'>();
  readonly witnessItems = input<readonly string[]>([]);
  readonly inputSequence = input.required<string>();
  readonly spentOutputAmountSats = input.required<number | null>();
  readonly spentOutputScriptPubKey = input.required<string>();
  readonly outputRequested = output<void>();
  readonly assemblyRequested = output<Event>();
  protected readonly modalFixture = signal<BitcoinObjectFixture | null>(null);
  private readonly referencedOutputReference = viewChild<ElementRef<HTMLElement>>(
    'referencedOutputReference',
  );
  private focusTimer: ReturnType<typeof setTimeout> | undefined;

  protected findSpentOutput(): void {
    this.outputRequested.emit();
    this.focusTimer = setTimeout(() => {
      this.focusTimer = undefined;
      this.referencedOutputReference()?.nativeElement.focus();
    });
  }

  protected openInputReference(): void {
    const source = this.sources().script_sig;
    const fixture = fixtureForRoute('tx-input', source.transaction_txid, source.index);
    this.modalFixture.set(
      fixture ??
        txInPreparationFixture({
          spendingTxid: source.transaction_txid,
          inputIndex: source.index,
          previousTxid: this.sources().script_pubkey.transaction_txid,
          previousVout: this.sources().script_pubkey.index,
          scriptSig: this.scripts().unlocking,
          sequence: this.inputSequence(),
          scriptType: this.scriptType(),
          witnessItems: this.witnessItems(),
        }),
    );
  }

  protected openOutputReference(): void {
    const source = this.sources().script_pubkey;
    const fixture = fixtureForRoute('tx-output', source.transaction_txid, source.index);
    this.modalFixture.set(
      fixture ??
        txOutPreparationFixture({
          transactionTxid: source.transaction_txid,
          outputIndex: source.index,
          amountSats: this.spentOutputAmountSats(),
          scriptPubKey: this.spentOutputScriptPubKey(),
          scriptType: this.scriptType(),
        }),
    );
  }

  protected closeModal(): void {
    this.modalFixture.set(null);
  }

  protected openRelatedReference(reference: BitcoinObjectReference): void {
    const fixture = fixtureById(reference.fixtureId);
    if (fixture) this.modalFixture.set(fixture);
  }

  protected shortValue(value: string): string {
    return value.length > 24 ? `${value.slice(0, 10)}…${value.slice(-10)}` : value;
  }

  protected outpointLabel(): string {
    const source = this.sources().script_pubkey;
    return `${this.shortValue(source.transaction_txid)} : ${source.index}`;
  }

  ngOnDestroy(): void {
    clearTimeout(this.focusTimer);
  }
}
