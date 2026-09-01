import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

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
  private readonly dialogClose = viewChild<ElementRef<HTMLButtonElement>>('dialogClose');
  private returnFocus: HTMLElement | null = null;

  protected readonly items = computed(() => {
    const values = this.snapshot().items;
    return values.map((value, index) => ({
      key: `${this.stepIndex()}:${index}:${value}`,
      position: describeStackPosition(index, values.length),
      value: value || '00',
      ...describeStackValue(value || '00'),
    }));
  });
  protected readonly visibleItems = computed(() => this.items().slice(0, 6));
  protected readonly hiddenItemCount = computed(() => Math.max(0, this.items().length - 6));
  protected readonly hasOverflow = computed(() => this.items().length > 6);

  protected openAllItems(): void {
    this.returnFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.expanded.set(true);
    setTimeout(() => this.dialogClose()?.nativeElement.focus());
  }

  protected closeAllItems(): void {
    this.expanded.set(false);
    const target = this.returnFocus;
    this.returnFocus = null;
    queueMicrotask(() => target?.focus());
  }

  protected handleDialogKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeAllItems();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLElement;
    const controls = [...dialog.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
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
