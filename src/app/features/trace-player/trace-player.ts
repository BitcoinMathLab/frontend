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
import { ScriptPreparation } from '../script-preparation/script-preparation';
import { ScriptParser } from '../script-parser/script-parser';
import { SignatureDetail } from '../signature-detail/signature-detail';
import { StackItemDetail, StackItemDetailContent } from '../stack-item-detail/stack-item-detail';
import { StackMovement, StackMovementItem } from '../stack-movement/stack-movement';
import { StackWorkbench } from '../stack-workbench/stack-workbench';

type PlaybackPhase = 'opcode' | 'stack-push' | 'stack-validation';
type PreparationStage = 0 | 1 | 2;

interface PlaybackStep {
  readonly step: TraceStep;
  readonly phase: PlaybackPhase;
}

@Component({
  selector: 'app-trace-player',
  imports: [
    OperationDetail,
    ScriptPreparation,
    ScriptParser,
    SignatureDetail,
    StackItemDetail,
    StackMovement,
    StackWorkbench,
  ],
  templateUrl: './trace-player.html',
  styleUrl: './trace-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayer implements OnDestroy {
  readonly trace = input.required<ExecutionTrace>();
  readonly scripts = input.required<TraceScripts>();
  readonly sources = input.required<TraceSources>();
  readonly scriptType = input<'P2PKH' | 'P2WPKH' | 'P2MS'>('P2PKH');
  readonly witnessItems = input<readonly string[]>([]);
  readonly inputSequence = input.required<string>();
  readonly spentOutputAmountSats = input.required<number | null>();
  readonly spentOutputScriptPubKey = input.required<string>();
  readonly executionAssembled = output<void>();
  readonly openSignatureWorkspace = output<void>();

  protected readonly currentIndex = signal(-1);
  protected readonly playing = signal(false);
  protected readonly preparationStage = signal<PreparationStage>(0);
  protected readonly preparationComplete = computed(() => this.preparationStage() === 2);
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
    if (!this.preparationComplete()) return 'Prepare scripts';
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
      return `Push DATA (${pushedDataLabel(playback.step, this.trace(), this.scripts().unlocking, this.scriptType())}) onto the main stack.`;
    }
    if (playback.phase === 'stack-validation') {
      return 'Check the stack conditions at the end of script execution. A spend is valid only when the final stack value is true.';
    }
    return describeStackEffect(playback.step, false);
  });
  protected readonly stackMovement = computed(() => {
    const playback = this.currentPlayback();
    if (
      !playback ||
      playback.phase === 'stack-validation' ||
      (playback.phase === 'opcode' && playback.step.opcode.is_push)
    ) {
      return { consumed: [], produced: [] };
    }
    return describeStackMovement(playback.step);
  });
  protected readonly isSignatureCheck = computed(
    () =>
      this.currentPlayback()?.phase === 'opcode' &&
      (this.currentStep()?.opcode.name.includes('CHECKSIG') ||
        this.currentStep()?.opcode.name.includes('CHECKMULTISIG')),
  );
  protected readonly signature = computed(
    () => this.currentStep()?.stacks.before.main.items[1] ?? 'Unavailable in this trace',
  );
  protected readonly publicKey = computed(
    () => this.currentStep()?.stacks.before.main.items[0] ?? 'Unavailable in this trace',
  );
  protected readonly operationDetail = computed(() => {
    const data = this.selectedData();
    if (data)
      return describePushedData(data, this.trace(), this.scripts().unlocking, this.scriptType());
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
  private focusTimer: ReturnType<typeof setTimeout> | undefined;
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

  protected findPreviousOutput(): void {
    this.preparationStage.set(1);
  }

  protected prepareExecution(event: Event): void {
    const player = (event.currentTarget as HTMLElement).closest<HTMLElement>('.player');
    this.preparationStage.set(2);
    this.executionAssembled.emit();
    clearTimeout(this.focusTimer);
    this.focusTimer = setTimeout(() => {
      this.focusTimer = undefined;
      player?.querySelector<HTMLButtonElement>('.vcr__primary')?.focus();
    });
  }

  protected signatureTypeTitle(): string {
    return this.scriptType() === 'P2WPKH'
      ? 'Pay to Witness Public Key Hash'
      : this.scriptType() === 'P2MS'
        ? 'Pay to Multisig'
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
    if (!this.preparationComplete()) return;
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
    } else if (!this.preparationComplete()) {
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
    if (this.focusTimer !== undefined) clearTimeout(this.focusTimer);
  }

  private advance(): void {
    if (!this.preparationComplete()) return;
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
  scriptType: 'P2PKH' | 'P2WPKH' | 'P2MS',
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

  if (scriptType === 'P2MS' && isUnlockingData && step.opcode.name === 'OP_0') {
    return {
      kind: 'DATA',
      name: 'CHECKMULTISIG dummy',
      hex: '',
      summary:
        'An empty historical compatibility item consumed by OP_CHECKMULTISIG before it checks the signatures.',
      requirement: 'The scriptSig must place this empty NULLDUMMY item beneath its signatures.',
    };
  }
  if (scriptType === 'P2MS' && isUnlockingData) {
    return {
      kind: 'DATA',
      name: `Signature ${unlockingPosition + 1}`,
      hex: step.opcode.push_data ?? step.opcode.raw,
      summary:
        'A DER-encoded ECDSA signature plus its hash-type byte, checked in order against the committed public keys.',
      requirement: 'The scriptSig places this signature above the historical dummy item.',
    };
  }
  if (scriptType === 'P2MS') {
    const lockingPushes = trace.steps.filter(
      (candidate) => candidate.opcode.is_push && candidate.opcode.byte_offset >= unlockingLength,
    );
    const lockingPosition = lockingPushes.findIndex((candidate) => candidate.index === step.index);
    return {
      kind: 'DATA',
      name: `Public key ${lockingPosition + 1}`,
      hex: step.opcode.push_data ?? step.opcode.raw,
      summary: 'A SEC-encoded public key committed directly by the bare multisig locking script.',
      requirement: 'OP_CHECKMULTISIG tests the ordered signatures against this ordered key list.',
    };
  }

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
    case 'OP_CHECKMULTISIG':
      return 'Consume the threshold, ordered public keys, signatures, and historical dummy; then push true when enough signatures match in order.';
    default: {
      const before = step.stacks.before.main.depth;
      const after = step.stacks.after.main.depth;
      if (after > before) return `Push ${after - before} item(s) onto the stack.`;
      if (after < before) return `Consume ${before - after} net stack item(s).`;
      return 'Transform the current stack without changing its depth.';
    }
  }
}

function describeStackMovement(step: TraceStep): {
  consumed: StackMovementItem[];
  produced: StackMovementItem[];
} {
  const before = [...step.stacks.before.main.items];
  const after = [...step.stacks.after.main.items];
  const remainingAfter = [...after];
  const consumed = before.filter((value) => !removeFirst(remainingAfter, value));

  const remainingBefore = [...before];
  const produced = after.filter((value) => !removeFirst(remainingBefore, value));

  return {
    consumed: consumed.map((value) => movementItem(value)),
    produced: produced.map((value) => movementItem(value)),
  };
}

function removeFirst(values: string[], target: string): boolean {
  const index = values.indexOf(target);
  if (index < 0) return false;
  values.splice(index, 1);
  return true;
}

function movementItem(value: string): StackMovementItem {
  if (value === '' || value === '00') return { label: 'false', value: value || '00' };
  if (value === '01') return { label: 'true', value };
  const byteLength = value.length / 2;
  if (byteLength === 20) return { label: 'hash', value };
  if (
    (byteLength === 33 && /^(02|03)/.test(value)) ||
    (byteLength === 65 && value.startsWith('04'))
  ) {
    return { label: 'public key', value };
  }
  if (value.startsWith('30') && byteLength >= 8) return { label: 'signature', value };
  return { label: 'data', value };
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

function pushedDataLabel(
  step: TraceStep,
  trace: ExecutionTrace,
  unlockingScript: string,
  scriptType: 'P2PKH' | 'P2WPKH' | 'P2MS',
): string {
  const unlockingLength = unlockingScript.length / 2;
  const isUnlockingData = step.opcode.byte_offset < unlockingLength;
  const unlockingPushes = trace.steps.filter(
    (candidate) => candidate.opcode.is_push && candidate.opcode.byte_offset < unlockingLength,
  );
  const position = unlockingPushes.findIndex((candidate) => candidate.index === step.index);
  if (scriptType === 'P2MS' && isUnlockingData) return `Signature ${position + 1}`;
  if (scriptType === 'P2MS') {
    const lockingPushes = trace.steps.filter(
      (candidate) => candidate.opcode.is_push && candidate.opcode.byte_offset >= unlockingLength,
    );
    const lockingPosition = lockingPushes.findIndex((candidate) => candidate.index === step.index);
    return `Public key ${lockingPosition + 1}`;
  }
  if (isUnlockingData && position === 0) return 'Signature';
  if (isUnlockingData && position === 1) return 'Public key';
  return 'Expected public-key hash';
}
