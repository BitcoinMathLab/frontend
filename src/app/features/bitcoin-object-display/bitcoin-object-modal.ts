import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { saveTransientObjectFixture } from '../../core/transient-object-fixtures';
import { BitcoinObjectFixture, BitcoinObjectReference } from './bitcoin-object-display.models';
import { BitcoinObjectDisplay } from './bitcoin-object-display';

@Component({
  selector: 'app-bitcoin-object-modal',
  imports: [BitcoinObjectDisplay, RouterLink],
  templateUrl: './bitcoin-object-modal.html',
  styleUrl: './bitcoin-object-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BitcoinObjectModal implements AfterViewInit, OnDestroy {
  readonly fixture = input.required<BitcoinObjectFixture>();
  readonly showFullPage = input(true);
  readonly closed = output<void>();
  readonly referenceOpened = output<BitcoinObjectReference>();
  private readonly document = inject(DOCUMENT);
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly returnFocus = this.document.activeElement as HTMLElement | null;
  private readonly previousOverflow = this.document.body.style.overflow;

  constructor() {
    this.document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.panel().nativeElement.querySelector<HTMLElement>('[data-modal-initial-focus]')?.focus();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closed.emit();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.focusableElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected dismissBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  protected prepareFullPage(): void {
    saveTransientObjectFixture(this.fixture());
  }

  ngOnDestroy(): void {
    this.document.body.style.overflow = this.previousOverflow;
    this.returnFocus?.focus();
  }

  private focusableElements(): HTMLElement[] {
    return [
      ...this.panel().nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), summary, [tabindex]:not([tabindex="-1"])',
      ),
    ];
  }
}
