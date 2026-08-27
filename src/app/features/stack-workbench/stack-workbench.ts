import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { StackSnapshot, TraceStep } from '../../core/trace-api.models';
import { StackView } from '../stack-view/stack-view';
import { StackItemDetailContent } from '../stack-item-detail/stack-item-detail';

interface MovementItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-stack-workbench',
  imports: [StackView],
  templateUrl: './stack-workbench.html',
  styleUrl: './stack-workbench.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackWorkbench {
  readonly step = input<TraceStep | null>(null);
  readonly showBefore = input(false);
  readonly showMovement = input(true);
  readonly inspectItem = output<StackItemDetailContent>();

  protected readonly movement = computed(() =>
    this.step() ? stackMovement(this.step() as TraceStep) : { consumed: [], produced: [] },
  );
  protected readonly mainStack = computed<StackSnapshot>(
    () =>
      (this.showBefore() ? this.step()?.stacks.before.main : this.step()?.stacks.after.main) ?? {
        depth: 0,
        items: [],
      },
  );

  protected readonly stackStateLabel = computed(() => {
    const step = this.step();
    if (!step) return 'empty before execution';
    if (this.showBefore()) return `before ${step.opcode.name}`;
    return step.opcode.is_push ? 'after STACK PUSH' : `after ${step.opcode.name}`;
  });
}

function stackMovement(step: TraceStep): { consumed: MovementItem[]; produced: MovementItem[] } {
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

function movementItem(value: string): MovementItem {
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
