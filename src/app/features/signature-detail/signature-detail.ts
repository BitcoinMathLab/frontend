import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-signature-detail',
  templateUrl: './signature-detail.html',
  styleUrl: './signature-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignatureDetail implements AfterViewInit {
  readonly signature = input.required<string>();
  readonly publicKey = input.required<string>();
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
