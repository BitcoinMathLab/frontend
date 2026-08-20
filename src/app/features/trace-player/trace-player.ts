import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnDestroy,
  signal,
} from '@angular/core';

import { ExecutionTrace } from '../../core/trace-api.models';

@Component({
  selector: 'app-trace-player',
  templateUrl: './trace-player.html',
  styleUrl: './trace-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TracePlayer implements OnDestroy {
  readonly trace = input.required<ExecutionTrace>();
  protected readonly currentIndex = signal(0);
  protected readonly playing = signal(false);
  protected readonly currentStep = computed(() => this.trace().steps[this.currentIndex()]);
  protected readonly atStart = computed(() => this.currentIndex() === 0);
  protected readonly atEnd = computed(
    () => this.currentIndex() >= Math.max(this.trace().steps.length - 1, 0),
  );
  protected readonly stepLabel = computed(
    () => `Step ${this.currentIndex() + 1} of ${this.trace().steps.length}`,
  );

  private timer: ReturnType<typeof setInterval> | undefined;

  protected previous(): void {
    this.pause();
    this.currentIndex.update((index) => Math.max(index - 1, 0));
  }

  protected next(): void {
    this.pause();
    this.advance();
  }

  protected reset(): void {
    this.pause();
    this.currentIndex.set(0);
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.pause();
      return;
    }
    if (this.atEnd()) {
      this.currentIndex.set(0);
    }
    this.playing.set(true);
    this.timer = setInterval(() => this.advance(), 900);
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === ' ') {
      event.preventDefault();
      this.togglePlay();
    }
  }

  ngOnDestroy(): void {
    this.pause();
  }

  private advance(): void {
    if (this.atEnd()) {
      this.pause();
      return;
    }
    this.currentIndex.update((index) => index + 1);
    if (this.atEnd()) {
      this.pause();
    }
  }

  private pause(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.playing.set(false);
  }
}
