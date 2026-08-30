import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

import { P2pkhTraceResponse } from '../../core/trace-api.models';

type SignatureRegion = 'transaction' | 'script-sig' | 'script-pubkey' | 'sighash' | 'digest';

interface SignatureStep {
  readonly phase: string;
  readonly title: string;
  readonly description: string;
  readonly regions: readonly SignatureRegion[];
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
    regions: ['transaction', 'script-pubkey', 'sighash'],
  },
  {
    phase: 'Hash message',
    title: 'Hash the legacy preimage twice',
    description:
      'Apply SHA-256 twice. The resulting 32-byte digest is the ECDSA verification message.',
    regions: ['transaction', 'script-pubkey', 'sighash', 'digest'],
  },
  {
    phase: 'Verify ECDSA',
    title: 'Check the signature and public key',
    description:
      'Verify the DER-encoded signature over the digest with the public key supplied by the spending input.',
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
  readonly result = input.required<P2pkhTraceResponse>();
  readonly transactionHex = input.required<string>();

  protected readonly currentIndex = signal(0);
  protected readonly playing = signal(false);
  protected readonly currentStep = computed(() => STEPS[this.currentIndex()]);
  protected readonly atStart = computed(() => this.currentIndex() === 0);
  protected readonly atEnd = computed(() => this.currentIndex() === STEPS.length - 1);
  protected readonly progress = computed(() => (this.currentIndex() / (STEPS.length - 1)) * 100);
  protected readonly stepLabel = computed(
    () => `Step ${this.currentIndex()} of ${STEPS.length - 1}`,
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
    this.currentIndex.update((index) => Math.min(STEPS.length - 1, index + 1));
    if (this.atEnd()) this.stop();
  }

  protected finish(): void {
    this.stop();
    this.currentIndex.set(STEPS.length - 1);
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
