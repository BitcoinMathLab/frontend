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

  it('starts before step one with empty stacks and backward controls disabled', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Script');
    expect(compiled.textContent).toContain('scriptSig');
    expect(compiled.textContent).toContain('scriptPubKey');
    expect(compiled.textContent).toContain('PUSH signature');
    expect(compiled.textContent).toContain('OP_ADD');
    expect(compiled.textContent).toContain('Ready · step 0 of 3');
    expect(compiled.textContent).toContain('Ready to run');
    expect(compiled.textContent).toContain('Empty stack');
    expect(compiled.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
    expect(control('Restart trace').disabled).toBe(true);
    expect(control('Previous step').disabled).toBe(true);
    expect(control('Next step').disabled).toBe(false);
  });

  it('moves forward, backward, jumps to the result, and resets', () => {
    expect(fixture.nativeElement.textContent).toContain('Ready to run');
    expect(fixture.nativeElement.textContent).not.toContain('Valid spend');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
    ).toBe('33');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');

    control('Previous step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    control('Go to result').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');
    expect(fixture.nativeElement.textContent).toContain('Valid spend');

    control('Restart trace').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ready · step 0 of 3');
    expect(fixture.nativeElement.textContent).toContain('Ready to run');
  });

  it('plays to the final step and pauses automatically', () => {
    vi.useFakeTimers();
    const play = [...fixture.nativeElement.querySelectorAll('.vcr button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Play'),
    ) as HTMLButtonElement;
    play.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    vi.advanceTimersByTime(2_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');
    expect(fixture.nativeElement.textContent).toContain('Play');
    expect(control('Next step').disabled).toBe(true);
  });

  it('supports arrow, space, Home, and End keyboard controls', () => {
    const player = fixture.nativeElement.querySelector('.player') as HTMLElement;
    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 3 of 3');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ready · step 0 of 3');
    expect(control('Restart trace').getAttribute('aria-keyshortcuts')).toBe('Home');
    expect(control('Go to result').getAttribute('aria-keyshortcuts')).toBe('End');
  });

  it('shows the current stack workbench and per-operation movement', () => {
    control('Go to result').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Execution');
    expect(fixture.nativeElement.textContent).toContain('Stack state');
    expect(fixture.nativeElement.textContent).toContain('after OP_ADD');
    expect(fixture.nativeElement.textContent).toContain('Main stack');
    expect(fixture.nativeElement.textContent).toContain('Alt stack');
    expect(fixture.nativeElement.textContent).toContain('Consumed');
    expect(fixture.nativeElement.textContent).toContain('− data');
    expect(fixture.nativeElement.textContent).toContain('Produced');
    expect(fixture.nativeElement.textContent).toContain('+ data');
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

  it('opens opcode information without advancing the walkthrough', () => {
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 1
          ? { ...step, opcode: { ...step.opcode, name: 'OP_DUP', is_push: false } }
          : step,
      ),
    });
    fixture.detectChanges();

    const opcode = [...fixture.nativeElement.querySelectorAll('.operation-list button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('OP_DUP'),
    ) as HTMLButtonElement;
    opcode.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Opcode');
    expect(dialog.textContent).toContain('Copy the top stack item');
    expect(dialog.textContent).toContain('Execution stops if the stack is empty');
    expect(fixture.nativeElement.textContent).toContain('Ready · step 0 of 3');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
  });

  it('explains the role of pushed P2PKH data without advancing', () => {
    const signature = [...fixture.nativeElement.querySelectorAll('.operation-list button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('PUSH signature'),
    ) as HTMLButtonElement;
    signature.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Signature data');
    expect(dialog.textContent).toContain('DER-encoded ECDSA signature');
    expect(dialog.textContent).toContain('pushes the signature onto the empty stack');
    expect(fixture.nativeElement.textContent).toContain('Ready · step 0 of 3');
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

    expect(fixture.nativeElement.textContent).toContain('Ready to run');
    expect(fixture.nativeElement.textContent).not.toContain('Why execution failed');
    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('In progress');
    expect(fixture.nativeElement.textContent).not.toContain('The final stack value is false.');

    control('Go to result').click();
    fixture.detectChanges();

    const explanation = fixture.nativeElement.querySelector(
      '[aria-label="Failure explanation"]',
    ) as HTMLElement;
    expect(explanation.textContent).toContain('Why execution failed');
    expect(explanation.textContent).toContain('The final stack value is false.');
    expect(explanation.textContent).toContain('false-final-value');
  });
});
