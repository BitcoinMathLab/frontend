import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TRACE_FIXTURE } from '../../testing/trace.fixture';
import { TracePlayer } from './trace-player';

describe('TracePlayer', () => {
  let fixture: ComponentFixture<TracePlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TracePlayer] }).compileComponents();
    fixture = TestBed.createComponent(TracePlayer);
    fixture.componentRef.setInput('trace', TRACE_FIXTURE);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function button(label: string): HTMLButtonElement {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const match = buttons.find((candidate) => candidate.textContent?.trim() === label);
    if (!match) throw new Error(`Missing ${label} button`);
    return match;
  }

  it('starts at the first step with backward controls disabled', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Step 1 of 3');
    expect(compiled.textContent).toContain('OP_1');
    expect(button('Reset').disabled).toBe(true);
    expect(button('Previous').disabled).toBe(true);
    expect(button('Next').disabled).toBe(false);
  });

  it('moves forward, backward, and resets without losing the trace', () => {
    button('Next').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');
    expect(fixture.nativeElement.textContent).toContain('OP_2');

    button('Previous').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    button('Next').click();
    fixture.detectChanges();
    button('Reset').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });

  it('plays to the final step and pauses automatically', () => {
    vi.useFakeTimers();

    button('Play').click();
    fixture.detectChanges();
    expect(button('Pause')).toBeTruthy();

    vi.advanceTimersByTime(1_800);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');
    expect(button('Play')).toBeTruthy();
    expect(button('Next').disabled).toBe(true);
  });

  it('supports arrow and space keyboard controls', () => {
    const player = fixture.nativeElement.querySelector('.player') as HTMLElement;

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });
});
