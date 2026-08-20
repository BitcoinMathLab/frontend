import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-script-bytes',
  templateUrl: './script-bytes.html',
  styleUrl: './script-bytes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptBytes {
  readonly script = input.required<string>();
  readonly activeOffset = input.required<number>();
  readonly activeLength = input.required<number>();

  protected readonly bytes = computed(() => this.script().match(/.{2}/g) ?? []);

  protected isActive(index: number): boolean {
    return index >= this.activeOffset() && index < this.activeOffset() + this.activeLength();
  }
}
