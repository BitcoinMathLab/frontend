import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

import {
  SegwitV0SignatureVerification,
  SignatureWalkthroughResult,
} from '../../core/trace-api.models';
import {
  decodeTransactionBytes,
  TransactionByteField,
} from '../../pages/transaction-explorer/transaction-byte-decoder';

type SignatureRegion =
  | 'transaction'
  | 'script-sig'
  | 'script-pubkey'
  | 'prevouts'
  | 'sequences'
  | 'outputs'
  | 'amount'
  | 'script-code'
  | 'sighash'
  | 'digest';

interface SignatureStep {
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly regions: readonly SignatureRegion[];
}

interface InputRegion {
  readonly index: number;
  readonly fields: readonly TransactionByteField[];
}

interface OutputRegion {
  readonly index: number;
  readonly fields: readonly TransactionByteField[];
}

const STEPS: readonly SignatureStep[] = [
  {
    phase: 'Ready',
    title: 'Signature walkthrough ready',
    description: 'Press Play to build the exact message checked by OP_CHECKSIG.',
    regions: [],
  },
  {
    phase: 'Select input',
    title: 'Start with the spending transaction',
    description: 'Select this input and clear every input script in a temporary transaction copy.',
    regions: ['transaction', 'script-sig'],
  },
  {
    phase: 'Build message',
    title: 'Insert the previous locking script',
    description:
      "Replace the selected input's scriptSig with the previous output's scriptPubKey. The original signature is not part of the signed message.",
    regions: ['transaction', 'script-pubkey'],
  },
  {
    phase: 'Apply mode',
    title: 'Apply the signature commitments',
    description:
      'Keep the inputs, outputs, and sequences committed by this signature hash mode, then append its four-byte little-endian value.',
    regions: ['transaction', 'script-pubkey', 'outputs', 'sighash'],
  },
  {
    phase: 'Hash message',
    title: 'Hash the legacy preimage twice',
    description:
      'Apply SHA-256 twice. The resulting 32-byte digest is the ECDSA verification message.',
    regions: ['transaction', 'script-pubkey', 'outputs', 'sighash', 'digest'],
  },
  {
    phase: 'Verify ECDSA',
    title: 'Check the signature and public key',
    description:
      'Verify the DER-encoded signature over the digest with the public key supplied by the spending input.',
    regions: ['script-sig', 'digest'],
  },
];

const SEGWIT_STEPS: readonly SignatureStep[] = [
  {
    phase: 'Ready',
    title: 'SegWit signature walkthrough ready',
    description: 'Press Play to assemble the exact BIP143 message checked by OP_CHECKSIG.',
    regions: [],
  },
  {
    phase: 'Hash inputs',
    title: 'Commit every previous outpoint',
    description: 'Double-SHA-256 the ordered transaction IDs and output indexes into hashPrevouts.',
    regions: ['transaction', 'prevouts'],
  },
  {
    phase: 'Hash sequences',
    title: 'Commit every input sequence',
    description: 'Double-SHA-256 the ordered sequence values into hashSequence.',
    regions: ['transaction', 'sequences'],
  },
  {
    phase: 'Hash outputs',
    title: 'Commit the outputs selected by the mode',
    description:
      'The hash type chooses which serialized outputs are committed through hashOutputs.',
    regions: ['transaction', 'outputs', 'sighash'],
  },
  {
    phase: 'Bind input',
    title: 'Add the selected input context',
    description:
      'Add its outpoint, P2PKH scriptCode, spent amount, and sequence. BIP143 commits the previous value explicitly.',
    regions: ['transaction', 'script-pubkey', 'script-code', 'amount'],
  },
  {
    phase: 'Build message',
    title: 'Assemble the BIP143 preimage',
    description:
      'Combine version, component hashes, selected input context, locktime, and the four-byte hash type.',
    regions: [
      'transaction',
      'prevouts',
      'sequences',
      'outputs',
      'amount',
      'script-code',
      'sighash',
    ],
  },
  {
    phase: 'Hash message',
    title: 'Hash the BIP143 preimage twice',
    description: 'Apply SHA-256 twice to produce the 32-byte ECDSA verification message.',
    regions: ['digest'],
  },
  {
    phase: 'Verify ECDSA',
    title: 'Check the witness signature and public key',
    description:
      'Verify the DER signature over the digest with the compressed public key from the witness stack.',
    regions: ['script-sig', 'digest'],
  },
];

@Component({
  selector: 'app-signature-player',
  templateUrl: './signature-player.html',
  styleUrl: './signature-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignaturePlayer implements OnDestroy {
  readonly result = input.required<SignatureWalkthroughResult>();
  readonly transactionHex = input.required<string>();

  protected readonly currentIndex = signal(0);
  protected readonly playing = signal(false);
  protected readonly selectedInput = signal(0);
  protected readonly selectedOutput = signal(0);
  protected readonly steps = computed(() =>
    this.result().script_type === 'P2WPKH' ? SEGWIT_STEPS : STEPS,
  );
  protected readonly currentStep = computed(() => this.steps()[this.currentIndex()]);
  protected readonly atStart = computed(() => this.currentIndex() === 0);
  protected readonly atEnd = computed(() => this.currentIndex() === this.steps().length - 1);
  protected readonly progress = computed(
    () => (this.currentIndex() / (this.steps().length - 1)) * 100,
  );
  protected readonly stepLabel = computed(
    () => `Step ${this.currentIndex()} of ${this.steps().length - 1}`,
  );
  protected readonly transactionFields = computed<readonly TransactionByteField[]>(() => {
    try {
      return decodeTransactionBytes(this.transactionHex());
    } catch {
      return [
        {
          id: 'serialized-transaction',
          label: 'Serialized transaction',
          group: 'header',
          offset: 0,
          length: this.transactionHex().length / 2,
          hex: this.transactionHex(),
          decoded: 'Transaction fields are available for canonical serialized transactions.',
          description: 'Complete serialized transaction.',
        },
      ];
    }
  });
  protected readonly transactionHeaderFields = computed(() =>
    this.transactionFields().filter(
      (field) => field.group === 'header' || field.group === 'footer',
    ),
  );
  protected readonly inputRegions = computed<readonly InputRegion[]>(() => {
    const inputs = new Map<number, TransactionByteField[]>();
    for (const field of this.transactionFields()) {
      const match = /^input-(\d+)-/.exec(field.id);
      if (!match) continue;
      const index = Number(match[1]);
      inputs.set(index, [...(inputs.get(index) ?? []), field]);
    }
    return [...inputs.entries()].map(([index, fields]) => ({ index, fields }));
  });
  protected readonly displayedInput = computed(
    () =>
      this.inputRegions().find((input) => input.index === this.selectedInput()) ??
      this.inputRegions()[0] ?? { index: this.result().input_index, fields: [] },
  );
  protected readonly outputRegions = computed<readonly OutputRegion[]>(() => {
    const outputs = new Map<number, TransactionByteField[]>();
    for (const field of this.transactionFields()) {
      const match = /^output-(\d+)-/.exec(field.id);
      if (!match) continue;
      const index = Number(match[1]);
      outputs.set(index, [...(outputs.get(index) ?? []), field]);
    }
    return [...outputs.entries()].map(([index, fields]) => ({ index, fields }));
  });
  protected readonly displayedOutput = computed(
    () =>
      this.outputRegions().find((output) => output.index === this.selectedOutput()) ??
      this.outputRegions()[0] ?? { index: 0, fields: [] },
  );

  private timer: ReturnType<typeof setInterval> | undefined;

  protected reset(): void {
    this.stop();
    this.currentIndex.set(0);
  }

  protected previous(): void {
    this.stop();
    this.currentIndex.update((index) => Math.max(0, index - 1));
  }

  protected next(): void {
    this.currentIndex.update((index) => Math.min(this.steps().length - 1, index + 1));
    if (this.atEnd()) this.stop();
  }

  protected finish(): void {
    this.stop();
    this.currentIndex.set(this.steps().length - 1);
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (this.atEnd()) this.currentIndex.set(0);
    this.playing.set(true);
    this.timer = setInterval(() => this.next(), 1_100);
    this.next();
  }

  protected active(region: SignatureRegion): boolean {
    return this.currentStep().regions.includes(region);
  }

  protected chooseInput(index: number): void {
    this.selectedInput.set(index);
  }

  protected chooseOutput(index: number): void {
    this.selectedOutput.set(index);
  }

  protected inputFieldLabel(field: TransactionByteField): string {
    return field.label.replace(/^Input \d+/, `Input ${this.displayedInput().index}`);
  }

  protected outputFieldLabel(field: TransactionByteField): string {
    return field.label.replace(/^Output \d+/, `Output ${this.displayedOutput().index}`);
  }

  protected inputCommitted(index: number): boolean {
    const selected = this.result().input_index;
    if (index === selected) return this.active('transaction') || this.active('prevouts');
    if (this.result().signature.sighash_type & 0x80) return false;
    if (this.active('prevouts')) return true;
    if (!this.active('transaction')) return false;
    const baseType = this.result().signature.sighash_type & 0x1f;
    return baseType !== 2 && baseType !== 3;
  }

  protected outputCommitted(index: number): boolean {
    if (!this.active('outputs')) return false;
    const baseType = this.result().signature.sighash_type & 0x1f;
    if (baseType === 2) return false;
    if (baseType === 3) return index === this.result().input_index;
    return true;
  }

  protected hasDecodedWitness(): boolean {
    return this.displayedInput().fields.some((field) => field.group === 'witness');
  }

  protected segwitSignature(): SegwitV0SignatureVerification | null {
    const signature = this.result().signature;
    return 'hash_prevouts_hex' in signature ? signature : null;
  }

  protected witness(): readonly string[] {
    const scripts = this.result().scripts;
    return 'witness' in scripts ? scripts.witness : [];
  }

  protected lockingScript(): string {
    return this.result().scripts.locking;
  }

  protected unlockingData(): string {
    const scripts = this.result().scripts;
    return 'witness' in scripts ? scripts.witness.join(' · ') : scripts.unlocking;
  }

  protected spendingTransactionId(): string {
    const sources = this.result().sources;
    return 'witness' in sources
      ? sources.witness.transaction_txid
      : sources.script_sig.transaction_txid;
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.target instanceof HTMLButtonElement) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', ' '].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') this.previous();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'Home') this.reset();
    if (event.key === 'End') this.finish();
    if (event.key === ' ') this.togglePlay();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.playing.set(false);
  }
}
