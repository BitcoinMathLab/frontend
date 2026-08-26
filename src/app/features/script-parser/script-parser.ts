import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ExecutionTrace, P2pkhTraceResponse, TraceStep } from '../../core/trace-api.models';

interface ParsedOperation {
  readonly step: TraceStep;
  readonly phase: 'scriptSig' | 'scriptPubKey';
  readonly dataLabel: string | null;
}

@Component({
  selector: 'app-script-parser',
  templateUrl: './script-parser.html',
  styleUrl: './script-parser.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptParser {
  readonly trace = input.required<ExecutionTrace>();
  readonly scripts = input.required<P2pkhTraceResponse['scripts']>();
  readonly currentIndex = input.required<number>();
  readonly inspectStep = output<number>();
  readonly inspectData = output<number>();

  protected readonly operations = computed<readonly ParsedOperation[]>(() => {
    const unlockingLength = this.scripts().unlocking.length / 2;
    let unlockingPush = 0;
    return this.trace().steps.map((step) => {
      const phase = step.opcode.byte_offset < unlockingLength ? 'scriptSig' : 'scriptPubKey';
      let dataLabel: string | null = null;
      if (step.opcode.is_push && phase === 'scriptSig') {
        dataLabel = unlockingPush === 0 ? 'Signature' : 'Public key';
        unlockingPush += 1;
      } else if (step.opcode.is_push) {
        dataLabel = 'Expected public-key hash';
      }
      return { step, phase, dataLabel };
    });
  });
  protected readonly unlockingOperations = computed(() =>
    this.operations().filter((operation) => operation.phase === 'scriptSig'),
  );
  protected readonly lockingOperations = computed(() =>
    this.operations().filter((operation) => operation.phase === 'scriptPubKey'),
  );

  protected dataLength(operation: ParsedOperation): number {
    return (operation.step.opcode.push_data?.length ?? 0) / 2;
  }
}
