import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';

import { CURATED_P2PKH_REQUEST } from '../../core/curated-p2pkh';
import { TraceApi } from '../../core/trace-api';
import { P2pkhTraceResponse } from '../../core/trace-api.models';
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

  protected readonly response = signal<P2pkhTraceResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.loadTrace();
  }

  protected loadTrace(): void {
    this.requestSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(false);
    this.requestSubscription = this.traceApi
      .loadP2pkhTrace(CURATED_P2PKH_REQUEST)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.response.set(response),
        error: () => this.error.set(true),
      });
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
  }
}
