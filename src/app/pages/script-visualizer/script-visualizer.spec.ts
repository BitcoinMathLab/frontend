import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { TraceApi } from '../../core/trace-api';
import { TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { ScriptVisualizer } from './script-visualizer';

describe('ScriptVisualizer', () => {
  it('loads one curated P2PKH spend into the source and execution workspace', async () => {
    const loadP2pkhTrace = vi.fn().mockReturnValue(of(TRACE_RESPONSE_FIXTURE));
    await TestBed.configureTestingModule({
      imports: [ScriptVisualizer],
      providers: [{ provide: TraceApi, useValue: { loadP2pkhTrace } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ScriptVisualizer);
    fixture.detectChanges();

    expect(loadP2pkhTrace).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain('Watch Bitcoin Script execute.');
    expect(fixture.nativeElement.textContent).toContain('P2PKH example');
    expect(fixture.nativeElement.textContent).toContain('Raw scripts');
    expect(fixture.nativeElement.textContent).toContain('scriptSig');
    expect(fixture.nativeElement.textContent).toContain('scriptPubKey');
    expect(fixture.nativeElement.textContent).toContain('Script flow');
    expect(fixture.nativeElement.textContent).toContain('Stack state');
    expect(fixture.nativeElement.textContent).toContain('Execution details');
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
    expect(fixture.nativeElement.textContent).toContain('In progress');
    expect(fixture.nativeElement.textContent).not.toContain('Valid spend');
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

    (fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });
});
