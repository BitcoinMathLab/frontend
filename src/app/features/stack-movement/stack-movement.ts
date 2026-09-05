import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface StackMovementItem {
  readonly label: string;
  readonly value: string;
}

export interface StackMovementState {
  readonly consumed: readonly StackMovementItem[];
  readonly produced: readonly StackMovementItem[];
}

@Component({
  selector: 'app-stack-movement',
  templateUrl: './stack-movement.html',
  styleUrl: './stack-movement.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StackMovement {
  readonly movement = input.required<StackMovementState>();
}
