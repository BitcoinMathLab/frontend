import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { StackSnapshot, TraceStep } from '../../core/trace-api.models';
import { StackView } from '../stack-view/stack-view';
import { StackItemDetailContent } from '../stack-item-detail/stack-item-detail';

@Component({
  selector: 'app-stack-workbench',
  imports: [StackView],
  templateUrl: './stack-workbench.html',
  styleUrl: './stack-workbench.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackWorkbench {
  readonly step = input<TraceStep | null>(null);
  readonly showBefore = input(false);
  readonly inspectItem = output<StackItemDetailContent>();
  protected readonly mainStack = computed<StackSnapshot>(
    () =>
      (this.showBefore() ? this.step()?.stacks.before.main : this.step()?.stacks.after.main) ?? {
        depth: 0,
        items: [],
      },
  );

  protected readonly stackStateLabel = computed(() => {
    const step = this.step();
    if (!step) return 'empty before execution';
    if (this.showBefore()) return `before ${step.opcode.name}`;
    return step.opcode.is_push ? 'after STACK PUSH' : `after ${step.opcode.name}`;
  });
}
