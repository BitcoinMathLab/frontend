import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { StackSnapshot } from '../../core/trace-api.models';
import { StackItemDetailContent } from '../stack-item-detail/stack-item-detail';

@Component({
  selector: 'app-stack-view',
  templateUrl: './stack-view.html',
  styleUrl: './stack-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackView {
  readonly label = input.required<string>();
  readonly snapshot = input.required<StackSnapshot>();
  readonly stepIndex = input.required<number>();
  readonly inspectItem = output<StackItemDetailContent>();
  protected readonly expanded = signal(false);

  protected readonly items = computed(() => {
    const values = this.snapshot().items;
    return values.map((value, index) => ({
      key: `${this.stepIndex()}:${index}:${value}`,
      position: describeStackPosition(index, values.length),
      value: value || '00',
      ...describeStackValue(value || '00'),
    }));
  });
  protected readonly visibleItems = computed(() =>
    this.expanded() ? this.items() : this.items().slice(0, 6),
  );
  protected readonly hiddenItemCount = computed(() => Math.max(0, this.items().length - 6));
  protected readonly hasOverflow = computed(() => this.items().length > 6);

  protected openAllItems(): void {
    this.expanded.set(true);
  }

  protected closeAllItems(): void {
    this.expanded.set(false);
  }

  protected preview(value: string): string {
    return value.length > 8 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
  }
}

function describeStackPosition(index: number, depth: number): string {
  const position = index + 1;
  if (depth === 1) return `${position}`;
  if (index === 0) return `${position} (Top)`;
  if (index === depth - 1) return `${position} (Bottom)`;
  return `${position}`;
}

function describeStackValue(value: string): { kind: string; label: string } {
  const byteLength = value.length / 2;

  if (value === '' || value === '00') return { kind: 'boolean', label: 'False' };
  if (value === '01') return { kind: 'boolean', label: 'True' };
  if (byteLength === 20) return { kind: 'hash', label: '20-byte hash' };
  if (
    (byteLength === 33 && /^(02|03)/.test(value)) ||
    (byteLength === 65 && value.startsWith('04'))
  ) {
    return { kind: 'pubkey', label: 'Public key' };
  }
  if (value.startsWith('30') && byteLength >= 8) return { kind: 'signature', label: 'Signature' };
  return { kind: 'data', label: `${byteLength} ${byteLength === 1 ? 'byte' : 'bytes'}` };
}
