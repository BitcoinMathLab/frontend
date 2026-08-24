import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { StackSnapshot } from '../../core/trace-api.models';

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

  protected readonly items = computed(() =>
    this.snapshot().items.map((value, index) => ({
      key: `${this.stepIndex()}:${index}:${value}`,
      position: index === 0 ? 'Top' : `${index + 1}`,
      value: value || '00',
      ...describeStackValue(value || '00'),
    })),
  );
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
