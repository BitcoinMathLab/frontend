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
    expect(fixture.nativeElement.textContent).toContain('Stack visualizer');
    expect(fixture.nativeElement.textContent).toContain('scriptSig');
    expect(fixture.nativeElement.textContent).toContain('scriptPubKey');
    expect(fixture.nativeElement.textContent).toContain('Script');
    expect(fixture.nativeElement.textContent).toContain('Stack state');
    expect(fixture.nativeElement.textContent).toContain('Execution');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 3');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
    expect(fixture.nativeElement.textContent).not.toContain('Outpoint');
    expect(fixture.nativeElement.textContent).not.toContain('Value');
    expect(fixture.nativeElement.textContent).not.toContain('OP_DUP sandbox');
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
    expect(fixture.nativeElement.textContent).toContain('The walkthrough could not load.');
    expect(fixture.nativeElement.textContent).not.toContain('private network detail');

    (fixture.nativeElement.querySelector('.state-card button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(loadP2pkhTrace).toHaveBeenCalledTimes(2);
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 3');
  });
});
