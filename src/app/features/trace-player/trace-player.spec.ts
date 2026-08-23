import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TRACE_FIXTURE, TRACE_RESPONSE_FIXTURE } from '../../testing/trace.fixture';
import { TracePlayer } from './trace-player';

describe('TracePlayer', () => {
  let fixture: ComponentFixture<TracePlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TracePlayer] }).compileComponents();
    fixture = TestBed.createComponent(TracePlayer);
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) => ({
        ...step,
        opcode: {
          ...step.opcode,
          is_push: index < 2,
          push_data: index < 2 ? step.opcode.raw : null,
        },
      })),
    });
    fixture.componentRef.setInput('scripts', TRACE_RESPONSE_FIXTURE.scripts);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  function control(label: string): HTMLButtonElement {
    const match = fixture.nativeElement.querySelector(
      `[aria-label="${label}"]`,
    ) as HTMLButtonElement | null;
    if (!match) throw new Error(`Missing ${label} button`);
    return match;
  }

  it('parses scriptSig before scriptPubKey and starts with backward controls disabled', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Scripts become operations');
    expect(compiled.textContent).toContain('1 · scriptSig');
    expect(compiled.textContent).toContain('2 · scriptPubKey');
    expect(compiled.textContent).toContain('PUSH signature');
    expect(compiled.textContent).toContain('OP_ADD');
    expect(compiled.textContent).toContain('Step 1 of 3');
    expect(control('Restart trace').disabled).toBe(true);
    expect(control('Previous step').disabled).toBe(true);
    expect(control('Next step').disabled).toBe(false);
  });

  it('moves forward, backward, jumps to the result, and resets', () => {
    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');

    control('Previous step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    control('Go to result').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');

    control('Restart trace').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
  });

  it('plays to the final step and pauses automatically', () => {
    vi.useFakeTimers();
    const play = [...fixture.nativeElement.querySelectorAll('.vcr button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Play'),
    ) as HTMLButtonElement;
    play.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    vi.advanceTimersByTime(1_800);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');
    expect(fixture.nativeElement.textContent).toContain('Play');
    expect(control('Next step').disabled).toBe(true);
  });

  it('supports arrow and space keyboard controls', () => {
    const player = fixture.nativeElement.querySelector('.player') as HTMLElement;
    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');
  });

  it('shows the operation between before and current stack snapshots', () => {
    control('Go to result').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Execution window');
    expect(fixture.nativeElement.textContent).toContain('Before operation');
    expect(fixture.nativeElement.textContent).toContain('After operation · current stack');
    expect(fixture.nativeElement.textContent).toContain('Main stack before');
    expect(fixture.nativeElement.textContent).toContain('Main stack after');
  });

  it('opens and closes detailed signature verification from OP_CHECKSIG', () => {
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 2
          ? {
              ...step,
              opcode: { ...step.opcode, name: 'OP_CHECKSIG' },
              stacks: {
                ...step.stacks,
                before: {
                  ...step.stacks.before,
                  main: { depth: 2, items: ['02publickey', '30signature'] },
                },
              },
            }
          : step,
      ),
    });
    fixture.detectChanges();
    control('Go to result').click();
    fixture.detectChanges();

    const open = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('signature verification detail'),
    ) as HTMLButtonElement;
    open.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('How this signature is verified');
    expect(dialog.textContent).toContain('Apply SHA-256 twice');
    expect(dialog.textContent).toContain('30signature');
    control('Close detail').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('explains the safe diagnostic for a failed trace', () => {
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      success: false,
      diagnostic: {
        code: 'false-final-value',
        message: 'The final stack value is false.',
        step_index: 2,
        opcode_name: 'OP_ADD',
      },
    });
    fixture.detectChanges();

    const explanation = fixture.nativeElement.querySelector(
      '[aria-label="Failure explanation"]',
    ) as HTMLElement;
    expect(explanation.textContent).toContain('Why execution failed');
    expect(explanation.textContent).toContain('The final stack value is false.');
    expect(explanation.textContent).toContain('false-final-value');
  });
});
