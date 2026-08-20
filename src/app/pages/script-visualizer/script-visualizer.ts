import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { P2pkhTraceResponse } from '../../core/trace-api.models';
import { VISUALIZER_LESSONS, VisualizerLesson } from '../../core/visualizer-lessons';
import { TracePlayer } from '../../features/trace-player/trace-player';

@Component({
  selector: 'app-script-visualizer',
  imports: [TracePlayer],
  templateUrl: './script-visualizer.html',
  styleUrl: './script-visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScriptVisualizer implements OnInit, OnDestroy {
  private readonly traceApi = inject(TraceApi);
  private requestSubscription: Subscription | undefined;

  protected readonly lessons = VISUALIZER_LESSONS;
  protected readonly selectedLesson = signal<VisualizerLesson>(VISUALIZER_LESSONS[1]);
  protected readonly response = signal<P2pkhTraceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.selectLesson(VISUALIZER_LESSONS[1]);
  }

  protected loadTrace(): void {
    const request = this.selectedLesson().request;
    if (request === null) return;

    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.requestSubscription = this.traceApi
      .loadP2pkhTrace(request)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set(true),
      });
  }

  protected selectLesson(lesson: VisualizerLesson): void {
    this.requestSubscription?.unsubscribe();
    this.selectedLesson.set(lesson);
    this.response.set(null);
    this.error.set(false);

    if (lesson.request === null) {
      this.loading.set(false);
      return;
    }
    this.loadTrace();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }
}
