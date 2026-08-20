import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { ScriptVisualizer } from './script-visualizer';

describe('ScriptVisualizer', () => {
  it('loads the curated P2PKH trace into the player', async () => {
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [{ provide: TraceApi, useValue: { loadP2pkhTrace } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    expect(loadP2pkhTrace).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('A valid P2PKH spend');
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
    expect(fixture.nativeElement.textContent).toContain('Valid spend');
  });

  it('shows a safe retry state and recovers on the next request', async () => {
    const loadP2pkhTrace = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('private network detail')))
      .mockReturnValueOnce(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [{ provide: TraceApi, useValue: { loadP2pkhTrace } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('The trace API is not available.');
    expect(fixture.nativeElement.textContent).not.toContain('private network detail');

    const retry = fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();

    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });

  it('switches between P2PK context and the invalid live example', async () => {
    const invalidResponse = {
      ...TRACE_RESPONSE_FIXTURE,
      trace: { ...TRACE_RESPONSE_FIXTURE.trace, success: false },
    } as const;
    const loadP2pkhTrace = vi
      .fn()
      .mockReturnValueOnce(of(TRACE_RESPONSE_FIXTURE))
      .mockReturnValueOnce(of(invalidResponse));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [{ provide: TraceApi, useValue: { loadP2pkhTrace } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    const lessonButtons = fixture.nativeElement.querySelectorAll('.lesson-list button');
    lessonButtons[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('P2PK locks directly to a public key.');
    expect(fixture.nativeElement.querySelector('app-trace-player')).toBeNull();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(1);

    lessonButtons[2].click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('One changed signature byte');
    expect(fixture.nativeElement.textContent).toContain('Invalid spend');
  });
});
