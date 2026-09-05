import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { BitcoinObjectReference } from './bitcoin-object-display.models';

@Component({
  selector: 'app-object-reference',
  template: `
    @if (reference().openInNewTab) {
      <a [href]="reference().route" target="_blank" rel="noopener">
        <span>
          <strong>{{ reference().label }}</strong>
          <small>{{ reference().detail }}</small>
        </span>
        <span class="quick-view">Open display <span aria-hidden="true">↗</span></span>
      </a>
    } @else {
      <button type="button" (click)="opened.emit(reference())">
        <span>
          <strong>{{ reference().label }}</strong>
          <small>{{ reference().detail }}</small>
        </span>
        <span class="quick-view">Quick view <span aria-hidden="true">↗</span></span>
      </button>
    }
  `,
  styles: `
    :is(button, a) {
      display: flex;
      width: 100%;
      min-height: 4.2rem;
      border: 1px solid rgba(101, 167, 255, 0.35);
      border-radius: 0.7rem;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: rgba(101, 167, 255, 0.055);
      color: var(--color-paper);
      cursor: pointer;
      padding: 0.8rem 0.9rem;
      text-align: left;
      text-decoration: none;
    }

    strong,
    small {
      display: block;
    }

    strong {
      color: var(--color-blue);
      font-size: 0.92rem;
    }

    small {
      margin-top: 0.18rem;
      color: var(--color-text-subtle);
      font-family: var(--font-mono);
      font-size: 0.82rem;
      overflow-wrap: anywhere;
    }

    .quick-view {
      border: 1px solid rgba(67, 209, 139, 0.45);
      border-radius: 999px;
      background: rgba(67, 209, 139, 0.08);
      color: #b7f7d7;
      font-size: 0.75rem;
      font-weight: 750;
      padding: 0.35rem 0.55rem;
      white-space: nowrap;
    }

    @media (max-width: 34rem) {
      :is(button, a) {
        align-items: flex-start;
        flex-direction: column;
      }

      .quick-view {
        align-self: flex-start;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObjectReference {
  readonly reference = input.required<BitcoinObjectReference>();
  readonly opened = output<BitcoinObjectReference>();
}
