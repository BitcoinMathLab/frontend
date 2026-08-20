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
    })),
  );
}
