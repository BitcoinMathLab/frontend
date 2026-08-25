import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

import { ExecutionTrace, P2pkhTraceResponse, TraceStep } from '../../core/trace-api.models';
import { OperationDetail } from '../operation-detail/operation-detail';
import { ScriptParser } from '../script-parser/script-parser';
import { SignatureDetail } from '../signature-detail/signature-detail';
import { StackWorkbench } from '../stack-workbench/stack-workbench';

@Component({
  selector: 'app-trace-player',
  imports: [OperationDetail, ScriptParser, SignatureDetail, StackWorkbench],
  templateUrl: './trace-player.html',
  styleUrl: './trace-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayer implements OnDestroy {
  readonly trace = input.required<ExecutionTrace>();
  readonly scripts = input.required<P2pkhTraceResponse['scripts']>();

  protected readonly currentIndex = signal(-1);
  protected readonly playing = signal(false);
  protected readonly signatureDetailOpen = signal(false);
  protected readonly selectedOperation = signal<TraceStep | null>(null);
  protected readonly currentStep = computed(() =>
    this.currentIndex() < 0 ? undefined : this.trace().steps[this.currentIndex()],
  );
  protected readonly atStart = computed(() => this.currentIndex() < 0);
  protected readonly atEnd = computed(
    () => this.currentIndex() >= 0 && this.currentIndex() >= this.trace().steps.length - 1,
  );
  protected readonly stepLabel = computed(() =>
    this.atStart()
      ? `Ready · step 0 of ${this.trace().steps.length}`
      : `Step ${this.currentIndex() + 1} of ${this.trace().steps.length}`,
  );
  protected readonly progressPercent = computed(() => {
    const count = this.trace().steps.length;
    return count && this.currentIndex() >= 0
      ? Math.round(((this.currentIndex() + 1) / count) * 100)
      : 0;
  });
  protected readonly outcomeLabel = computed(() => {
    if (this.atStart()) return 'Ready to run';
    if (!this.atEnd()) return 'In progress';
    return this.trace().success ? 'Valid spend' : 'Invalid spend';
  });
  protected readonly phaseLabel = computed(() => {
    if (this.atStart()) return 'Waiting to begin';
    const unlockingLength = this.scripts().unlocking.length / 2;
    const step = this.currentStep();
    return step && step.opcode.byte_offset < unlockingLength
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
  protected readonly operationDetail = computed(() => {
    const step = this.selectedOperation();
    if (!step) return null;
    if (step.opcode.is_push)
      return describePushedData(step, this.trace(), this.scripts().unlocking);
    return {
      kind: 'Opcode',
      name: step.opcode.name,
      summary: describeStackEffect(step),
      requirement: describeRequirement(step),
    };
  });

  private timer: ReturnType<typeof setInterval> | undefined;
  private returnFocus: HTMLElement | null = null;

  protected previous(): void {
    this.pause();
    this.currentIndex.update((index) => Math.max(index - 1, -1));
  }

  protected next(): void {
    this.pause();
    this.advance();
  }

  protected reset(): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.selectedOperation.set(null);
    this.currentIndex.set(-1);
  }

  protected finish(): void {
    this.pause();
    this.currentIndex.set(Math.max(this.trace().steps.length - 1, 0));
  }

  protected inspectOperation(index: number): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.rememberFocus();
    this.selectedOperation.set(this.trace().steps[index] ?? null);
  }

  protected openSignatureDetail(): void {
    this.pause();
    this.rememberFocus();
    this.signatureDetailOpen.set(true);
  }

  protected closeOperationDetail(): void {
    this.selectedOperation.set(null);
    this.restoreFocus();
  }

  protected closeSignatureDetail(): void {
    this.signatureDetailOpen.set(false);
    this.restoreFocus();
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.pause();
      return;
    }
    if (this.atEnd()) this.currentIndex.set(-1);
    this.signatureDetailOpen.set(false);
    this.selectedOperation.set(null);
    this.playing.set(true);
    this.advance();
    if (this.playing()) this.timer = setInterval(() => this.advance(), 1000);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && (this.signatureDetailOpen() || this.selectedOperation())) {
      event.preventDefault();
      if (this.signatureDetailOpen()) this.closeSignatureDetail();
      else this.closeOperationDetail();
    } else if (this.signatureDetailOpen() || this.selectedOperation()) {
      return;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === ' ') {
      event.preventDefault();
      this.togglePlay();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.reset();
    } else if (event.key === 'End') {
      event.preventDefault();
      this.finish();
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

  private rememberFocus(): void {
    this.returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  private restoreFocus(): void {
    const target = this.returnFocus;
    this.returnFocus = null;
    queueMicrotask(() => target?.focus());
  }
}

function describeRequirement(step: TraceStep): string {
  switch (step.opcode.name) {
    case 'OP_DUP':
    case 'OP_HASH160':
      return 'Requires at least one stack item. Execution stops if the stack is empty.';
    case 'OP_EQUALVERIFY':
    case 'OP_CHECKSIG':
      return 'Requires two stack items. Execution stops when the required values are missing.';
    default:
      return 'Stack requirements depend on the opcode and the values available at this step.';
  }
}

function describePushedData(
  step: TraceStep,
  trace: ExecutionTrace,
  unlockingScript: string,
): {
  readonly kind: string;
  readonly name: string;
  readonly summary: string;
  readonly requirement: string;
} {
  const unlockingLength = unlockingScript.length / 2;
  const isUnlockingData = step.opcode.byte_offset < unlockingLength;
  const unlockingPushes = trace.steps.filter(
    (candidate) => candidate.opcode.is_push && candidate.opcode.byte_offset < unlockingLength,
  );
  const unlockingPosition = unlockingPushes.findIndex(
    (candidate) => candidate.index === step.index,
  );

  if (isUnlockingData && unlockingPosition === 0) {
    return {
      kind: 'Signature data',
      name: 'Transaction signature',
      summary:
        'A DER-encoded ECDSA signature plus a hash-type byte. OP_CHECKSIG uses it to test authorization for this spend.',
      requirement: 'This data instruction pushes the signature onto the empty stack.',
    };
  }
  if (isUnlockingData && unlockingPosition === 1) {
    return {
      kind: 'Public-key data',
      name: 'Public key',
      summary:
        'A SEC-encoded secp256k1 public key. Its HASH160 must match the hash committed by the previous output.',
      requirement: 'This data instruction pushes the public key above the signature.',
    };
  }
  if (!isUnlockingData) {
    return {
      kind: 'Hash data',
      name: 'Expected public-key hash',
      summary:
        'The 20-byte HASH160 committed by the previous output. OP_EQUALVERIFY compares it with the public key hash calculated during execution.',
      requirement: 'This data instruction pushes the expected hash for the comparison.',
    };
  }
  return {
    kind: 'Pushed data',
    name: step.opcode.name,
    summary: 'A value encoded directly inside the Bitcoin Script.',
    requirement: 'This data instruction adds the value without consuming an existing stack item.',
  };
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
