import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

import { ExecutionTrace, P2pkhTraceResponse, TraceStep } from '../../core/trace-api.models';
import { ScriptParser } from '../script-parser/script-parser';
import { SignatureDetail } from '../signature-detail/signature-detail';
import { StackWorkbench } from '../stack-workbench/stack-workbench';

@Component({
  selector: 'app-trace-player',
  imports: [ScriptParser, SignatureDetail, StackWorkbench],
  templateUrl: './trace-player.html',
  styleUrl: './trace-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayer implements OnDestroy {
  readonly trace = input.required<ExecutionTrace>();
  readonly scripts = input.required<P2pkhTraceResponse['scripts']>();

  protected readonly currentIndex = signal(0);
  protected readonly playing = signal(false);
  protected readonly signatureDetailOpen = signal(false);
  protected readonly currentStep = computed(() => this.trace().steps[this.currentIndex()]);
  protected readonly atStart = computed(() => this.currentIndex() === 0);
  protected readonly atEnd = computed(
    () => this.currentIndex() >= Math.max(this.trace().steps.length - 1, 0),
  );
  protected readonly stepLabel = computed(
    () => `Step ${this.currentIndex() + 1} of ${this.trace().steps.length}`,
  );
  protected readonly phaseLabel = computed(() => {
    const unlockingLength = this.scripts().unlocking.length / 2;
    return this.currentStep()?.opcode.byte_offset < unlockingLength
      ? 'Executing scriptSig first'
      : 'Executing scriptPubKey';
  });
  protected readonly stackEffect = computed(() => describeStackEffect(this.currentStep()));
  protected readonly isSignatureCheck = computed(() =>
    this.currentStep()?.opcode.name.includes('CHECKSIG'),
  );
  protected readonly signature = computed(
    () => this.currentStep()?.stacks.before.main.items[1] ?? 'Unavailable in this trace',
  );
  protected readonly publicKey = computed(
    () => this.currentStep()?.stacks.before.main.items[0] ?? 'Unavailable in this trace',
  );

  private timer: ReturnType<typeof setInterval> | undefined;

  protected previous(): void {
    this.pause();
    this.currentIndex.update((index) => Math.max(index - 1, 0));
  }

  protected next(): void {
    this.pause();
    this.advance();
  }

  protected reset(): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.currentIndex.set(0);
  }

  protected finish(): void {
    this.pause();
    this.currentIndex.set(Math.max(this.trace().steps.length - 1, 0));
  }

  protected goTo(index: number): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.currentIndex.set(index);
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.pause();
      return;
    }
    if (this.atEnd()) this.currentIndex.set(0);
    this.signatureDetailOpen.set(false);
    this.playing.set(true);
    this.timer = setInterval(() => this.advance(), 900);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.signatureDetailOpen()) {
      event.preventDefault();
      this.signatureDetailOpen.set(false);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === ' ') {
      event.preventDefault();
      this.togglePlay();
    }
  }

  ngOnDestroy(): void {
    this.pause();
  }

  private advance(): void {
    if (this.atEnd()) {
      this.pause();
      return;
    }
    this.signatureDetailOpen.set(false);
    this.currentIndex.update((index) => index + 1);
    if (this.atEnd()) this.pause();
  }

  private pause(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.playing.set(false);
  }
}

function describeStackEffect(step: TraceStep | undefined): string {
  if (!step) return 'No operation selected.';
  if (step.opcode.is_push) return 'Push the decoded script value onto the top of the stack.';
  switch (step.opcode.name) {
    case 'OP_DUP':
      return 'Copy the top stack item and push the duplicate.';
    case 'OP_HASH160':
      return 'Pop the public key, run SHA-256 then RIPEMD-160, and push the 20-byte digest.';
    case 'OP_EQUALVERIFY':
      return 'Pop both hashes. Continue only when they are byte-for-byte equal.';
    case 'OP_CHECKSIG':
      return 'Pop the public key and signature, verify ECDSA, and push true or false.';
    default: {
      const before = step.stacks.before.main.depth;
      const after = step.stacks.after.main.depth;
      if (after > before) return `Push ${after - before} item(s) onto the stack.`;
      if (after < before) return `Consume ${before - after} net stack item(s).`;
      return 'Transform the current stack without changing its depth.';
    }
  }
}
