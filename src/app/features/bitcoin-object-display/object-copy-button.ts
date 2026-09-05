import { ChangeDetectionStrategy, Component, input, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-object-copy-button',
  template: `
    <button type="button" [attr.aria-label]="buttonLabel()" (click)="copy()">
      @if (copied()) {
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
        <span>Copied</span>
      } @else {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
        </svg>
        <span>Copy</span>
      }
    </button>
  `,
  styles: `
    button {
      display: inline-flex;
      min-height: 2.35rem;
      border: 1px solid var(--color-border-strong);
      border-radius: 0.55rem;
      align-items: center;
      gap: 0.4rem;
      background: var(--color-surface);
      color: var(--color-paper);
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 750;
      padding: 0.45rem 0.7rem;
    }

    svg {
      width: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.8;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectCopyButton implements OnDestroy {
  readonly value = input.required<string>();
  readonly label = input('value');
  protected readonly copied = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  protected buttonLabel(): string {
    return this.copied() ? `Copied ${this.label()}` : `Copy ${this.label()}`;
  }

  protected async copy(): Promise<void> {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(this.value());
      this.copied.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 1_500);
    } catch {
      this.copied.set(false);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.resetTimer);
  }
}
