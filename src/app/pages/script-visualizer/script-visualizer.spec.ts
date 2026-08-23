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
    expect(fixture.nativeElement.textContent).toContain('Validate one P2PKH spend.');
    expect(fixture.nativeElement.textContent).toContain('Elements being evaluated');
    expect(fixture.nativeElement.textContent).toContain('scriptSig');
    expect(fixture.nativeElement.textContent).toContain('scriptPubKey');
    expect(fixture.nativeElement.textContent).toContain('Previous txid');
    expect(fixture.nativeElement.textContent).toContain('Scripts become operations');
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

    (fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });
});
