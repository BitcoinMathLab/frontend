import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  ExecutionTrace,
  P2pkhTraceResponse,
  ScriptSource,
  TraceStep,
} from '../../core/trace-api.models';

interface ParsedOperation {
  readonly step: TraceStep;
  readonly phase: 'scriptSig' | 'scriptPubKey';
  readonly dataLabel: string | null;
}

interface SelectedSource extends ScriptSource {
  readonly label: 'scriptSig' | 'scriptPubKey';
  readonly location: string;
  readonly description: string;
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
  readonly sources = input.required<P2pkhTraceResponse['sources']>();
  readonly currentIndex = input.required<number>();
  readonly currentPhase = input<'opcode' | 'stack-push' | 'stack-validation' | null>(null);
  readonly inspectStep = output<number>();
  readonly inspectData = output<number>();
  protected readonly selectedSource = signal<SelectedSource | null>(null);

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

  protected dataPreview(operation: ParsedOperation): string {
    const data = operation.step.opcode.push_data ?? '';
    return data.length > 8 ? `${data.slice(0, 4)}…${data.slice(-4)}` : data;
  }

  protected openSource(kind: 'script_sig' | 'script_pubkey'): void {
    const source = this.sources()[kind];
    this.selectedSource.set(
      kind === 'script_sig'
        ? {
            ...source,
            label: 'scriptSig',
            location: `input ${source.index + 1}`,
            description: 'This unlocking script is serialized in the spending transaction input.',
          }
        : {
            ...source,
            label: 'scriptPubKey',
            location: `output ${source.index}`,
            description:
              'This locking script is serialized in the previous transaction output being spent.',
          },
    );
  }

  protected closeSource(): void {
    this.selectedSource.set(null);
  }
}
