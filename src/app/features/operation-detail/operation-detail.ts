import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

export interface OperationDetailContent {
  readonly kind: string;
  readonly name: string;
  readonly hex: string;
  readonly summary: string;
  readonly requirement: string;
}

@Component({
  selector: 'app-operation-detail',
  templateUrl: './operation-detail.html',
  styleUrl: './operation-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationDetail implements AfterViewInit {
  readonly detail = input.required<OperationDetailContent>();
  readonly close = output<void>();
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');

  ngAfterViewInit(): void {
    queueMicrotask(() => this.dialog().nativeElement.focus());
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [...this.dialog().nativeElement.querySelectorAll<HTMLElement>('button')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
