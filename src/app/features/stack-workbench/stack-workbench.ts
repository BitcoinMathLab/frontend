import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TraceStep } from '../../core/trace-api.models';
import { StackView } from '../stack-view/stack-view';

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
  readonly step = input.required<TraceStep>();

  protected readonly movement = computed(() => stackMovement(this.step()));
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
