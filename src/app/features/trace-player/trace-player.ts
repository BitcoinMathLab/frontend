import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';

import { ExecutionTrace, TraceScripts, TraceSources, TraceStep } from '../../core/trace-api.models';
import { OperationDetail } from '../operation-detail/operation-detail';
import { ScriptParser } from '../script-parser/script-parser';
import { SignatureDetail } from '../signature-detail/signature-detail';
import { StackItemDetail, StackItemDetailContent } from '../stack-item-detail/stack-item-detail';
import { StackWorkbench } from '../stack-workbench/stack-workbench';

type PlaybackPhase = 'opcode' | 'stack-push' | 'stack-validation';

interface PlaybackStep {
  readonly step: TraceStep;
  readonly phase: PlaybackPhase;
}

@Component({
  selector: 'app-trace-player',
  imports: [OperationDetail, ScriptParser, SignatureDetail, StackItemDetail, StackWorkbench],
  templateUrl: './trace-player.html',
  styleUrl: './trace-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayer implements OnDestroy {
  readonly trace = input.required<ExecutionTrace>();
  readonly scripts = input.required<TraceScripts>();
  readonly sources = input.required<TraceSources>();
  readonly scriptType = input<'P2PKH' | 'P2WPKH'>('P2PKH');
  readonly witnessItems = input<readonly string[]>([]);
  readonly openSignatureWorkspace = output<void>();

  protected readonly currentIndex = signal(-1);
  protected readonly playing = signal(false);
  protected readonly preparationComplete = signal(false);
  protected readonly signatureDetailOpen = signal(false);
  protected readonly selectedOperation = signal<TraceStep | null>(null);
  protected readonly selectedData = signal<TraceStep | null>(null);
  protected readonly selectedStackItem = signal<StackItemDetailContent | null>(null);
  protected readonly playbackSteps = computed(() => playbackStepsFor(this.trace()));
  protected readonly currentPlayback = computed(() =>
    this.currentIndex() < 0 ? undefined : this.playbackSteps()[this.currentIndex()],
  );
  protected readonly currentStep = computed(() => this.currentPlayback()?.step);
  protected readonly atStart = computed(() => this.currentIndex() < 0);
  protected readonly atEnd = computed(
    () => this.currentIndex() >= 0 && this.currentIndex() >= this.playbackSteps().length - 1,
  );
  protected readonly stepLabel = computed(() =>
    this.atStart()
      ? `Step 0 of ${this.playbackSteps().length}`
      : `Step ${this.currentIndex() + 1} of ${this.playbackSteps().length}`,
  );
  protected readonly progressPercent = computed(() => {
    const count = this.playbackSteps().length;
    return count && this.currentIndex() >= 0
      ? Math.round(((this.currentIndex() + 1) / count) * 100)
      : 0;
  });
  protected readonly outcomeLabel = computed(() => {
    if (this.atStart()) return 'Ready';
    if (!this.atEnd()) return 'In progress';
    return this.trace().success ? 'Valid spend' : 'Invalid spend';
  });
  protected readonly phaseLabel = computed(() => {
    if (this.atStart()) return 'Waiting to begin';
    if (this.currentPlayback()?.phase === 'stack-validation') {
      return 'Checking final stack conditions';
    }
    const unlockingLength = this.scripts().unlocking.length / 2;
    const step = this.currentStep();
    if (this.scriptType() === 'P2WPKH') return 'Executing derived P2PKH scriptCode';
    return step && step.opcode.byte_offset < unlockingLength
      ? 'Executing scriptSig first'
      : 'Executing scriptPubKey';
  });
  protected readonly stackEffect = computed(() => {
    const playback = this.currentPlayback();
    if (!playback) return 'No operation selected.';
    if (playback.phase === 'stack-push') {
      return `Push DATA (${pushedDataLabel(playback.step, this.trace(), this.scripts().unlocking)}) onto the main stack.`;
    }
    if (playback.phase === 'stack-validation') {
      return 'Check the stack conditions at the end of script execution. A spend is valid only when the final stack value is true.';
    }
    return describeStackEffect(playback.step, false);
  });
  protected readonly isSignatureCheck = computed(
    () =>
      this.currentPlayback()?.phase === 'opcode' &&
      this.currentStep()?.opcode.name.includes('CHECKSIG'),
  );
  protected readonly signature = computed(
    () => this.currentStep()?.stacks.before.main.items[1] ?? 'Unavailable in this trace',
  );
  protected readonly publicKey = computed(
    () => this.currentStep()?.stacks.before.main.items[0] ?? 'Unavailable in this trace',
  );
  protected readonly operationDetail = computed(() => {
    const data = this.selectedData();
    if (data) return describePushedData(data, this.trace(), this.scripts().unlocking);
    const step = this.selectedOperation();
    if (!step) return null;
    return {
      kind: 'OP_CODE',
      name: step.opcode.name,
      hex: step.opcode.hex,
      summary: step.explanation,
      requirement: describeStackEffect(step),
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
    this.selectedData.set(null);
    this.selectedStackItem.set(null);
    this.currentIndex.set(-1);
  }

  protected prepareExecution(): void {
    this.preparationComplete.set(true);
  }

  protected signatureTypeTitle(): string {
    return this.scriptType() === 'P2WPKH'
      ? 'Pay to Witness Public Key Hash'
      : 'Pay to Public Key Hash';
  }

  protected finish(): void {
    this.pause();
    this.currentIndex.set(Math.max(this.playbackSteps().length - 1, 0));
  }

  protected inspectOperation(index: number): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.rememberFocus();
    this.selectedData.set(null);
    this.selectedStackItem.set(null);
    this.selectedOperation.set(this.trace().steps[index] ?? null);
  }

  protected inspectData(index: number): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.rememberFocus();
    this.selectedOperation.set(null);
    this.selectedStackItem.set(null);
    this.selectedData.set(this.trace().steps[index] ?? null);
  }

  protected inspectStackItem(item: StackItemDetailContent): void {
    this.pause();
    this.signatureDetailOpen.set(false);
    this.selectedOperation.set(null);
    this.selectedData.set(null);
    this.rememberFocus();
    this.selectedStackItem.set(item);
  }

  protected openSignatureDetail(): void {
    this.pause();
    this.rememberFocus();
    this.signatureDetailOpen.set(true);
    this.openSignatureWorkspace.emit();
  }

  protected closeOperationDetail(): void {
    this.selectedOperation.set(null);
    this.selectedData.set(null);
    this.selectedStackItem.set(null);
    this.restoreFocus();
  }

  protected closeStackItemDetail(): void {
    this.selectedStackItem.set(null);
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
    this.selectedData.set(null);
    this.selectedStackItem.set(null);
    this.playing.set(true);
    this.advance();
    if (this.playing()) this.timer = setInterval(() => this.advance(), 1000);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (
      event.key === 'Escape' &&
      (this.signatureDetailOpen() ||
        this.selectedOperation() ||
        this.selectedData() ||
        this.selectedStackItem())
    ) {
      event.preventDefault();
      if (this.signatureDetailOpen()) this.closeSignatureDetail();
      else if (this.selectedStackItem()) this.closeStackItemDetail();
      else this.closeOperationDetail();
    } else if (
      this.signatureDetailOpen() ||
      this.selectedOperation() ||
      this.selectedData() ||
      this.selectedStackItem()
    ) {
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
    this.selectedOperation.set(null);
    this.selectedData.set(null);
    this.selectedStackItem.set(null);
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

function describePushedData(
  step: TraceStep,
  trace: ExecutionTrace,
  unlockingScript: string,
): {
  readonly kind: string;
  readonly name: string;
  readonly hex: string;
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
      kind: 'DATA',
      name: 'Signature',
      hex: step.opcode.push_data ?? step.opcode.raw,
      summary:
        'A DER-encoded ECDSA signature plus a hash-type byte. OP_CHECKSIG uses it to test authorization for this spend.',
      requirement: 'The push opcode places this signature onto the empty stack.',
    };
  }
  if (isUnlockingData && unlockingPosition === 1) {
    return {
      kind: 'DATA',
      name: 'Public key',
      hex: step.opcode.push_data ?? step.opcode.raw,
      summary:
        'A SEC-encoded secp256k1 public key. Its HASH160 must match the hash committed by the previous output.',
      requirement: 'The push opcode places this public key above the signature.',
    };
  }
  return {
    kind: 'DATA',
    name: 'Expected public-key hash',
    hex: step.opcode.push_data ?? step.opcode.raw,
    summary:
      'The 20-byte HASH160 committed by the previous output. OP_EQUALVERIFY compares it with the calculated public-key hash.',
    requirement: 'The push opcode places this expected hash onto the stack for comparison.',
  };
}

function describeStackEffect(step: TraceStep | undefined, includePush = true): string {
  if (!step) return 'No operation selected.';
  if (step.opcode.is_push) {
    return includePush
      ? 'Push the decoded script value onto the top of the stack.'
      : `Read the next ${step.opcode.push_data?.length ? step.opcode.push_data.length / 2 : 0} data bytes. The stack is unchanged.`;
  }
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

function playbackStepsFor(trace: ExecutionTrace): readonly PlaybackStep[] {
  const executionSteps = trace.steps.flatMap((step) =>
    step.opcode.is_push
      ? [
          { step, phase: 'opcode' as const },
          { step, phase: 'stack-push' as const },
        ]
      : [{ step, phase: 'opcode' as const }],
  );
  const finalStep = trace.steps.at(-1);
  return finalStep
    ? [...executionSteps, { step: finalStep, phase: 'stack-validation' }]
    : executionSteps;
}

function pushedDataLabel(step: TraceStep, trace: ExecutionTrace, unlockingScript: string): string {
  const unlockingLength = unlockingScript.length / 2;
  const isUnlockingData = step.opcode.byte_offset < unlockingLength;
  const unlockingPushes = trace.steps.filter(
    (candidate) => candidate.opcode.is_push && candidate.opcode.byte_offset < unlockingLength,
  );
  const position = unlockingPushes.findIndex((candidate) => candidate.index === step.index);
  if (isUnlockingData && position === 0) return 'Signature';
  if (isUnlockingData && position === 1) return 'Public key';
  return 'Expected public-key hash';
}
