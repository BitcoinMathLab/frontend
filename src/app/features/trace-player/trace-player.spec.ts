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

    expect(compiled.textContent).toContain('Stack flow');
    expect(compiled.textContent).toContain('scriptSig');
    expect(compiled.textContent).toContain('scriptPubKey');
    expect(compiled.textContent).toContain('OP_1');
    expect(compiled.textContent).toContain('DATA (Signature)');
    expect(compiled.textContent).toContain('Original hex');
    expect(compiled.textContent).toContain('0x51');
    expect(compiled.textContent).toContain('OP_ADD');
    expect(compiled.textContent).toContain('Step 0 of 6');
    expect(compiled.textContent).toContain('Ready');
    expect(compiled.textContent).toContain('Empty stack');
    expect(compiled.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('0');
    expect(control('Restart trace').disabled).toBe(true);
    expect(control('Previous step').disabled).toBe(true);
    expect(control('Next step').disabled).toBe(false);
  });

  it('moves forward, backward, jumps to the result, and resets', () => {
    expect(fixture.nativeElement.textContent).toContain('Ready');
    expect(fixture.nativeElement.textContent).not.toContain('Valid spend');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running OP_1');
    expect(fixture.nativeElement.textContent).toContain('The stack is unchanged.');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),
    ).toBe('17');

    control('Next step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running STACK PUSH');
    expect(fixture.nativeElement.textContent).toContain('DATA (True)');

    control('Previous step').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    control('Go to result').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');
    expect(fixture.nativeElement.textContent).toContain('Now running STACK VALIDATION');
    expect(fixture.nativeElement.textContent).toContain('final stack value is true');
    expect(fixture.nativeElement.textContent).toContain('Valid spend');

    control('Restart trace').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
    expect(fixture.nativeElement.textContent).toContain('Ready');
  });

  it('plays to the final step and pauses automatically', () => {
    vi.useFakeTimers();
    const play = [...fixture.nativeElement.querySelectorAll('.vcr button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Play'),
    ) as HTMLButtonElement;
    play.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    vi.advanceTimersByTime(5_000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');
    expect(fixture.nativeElement.textContent).toContain('Play');
    expect(control('Next step').disabled).toBe(true);
  });

  it('supports arrow, space, Home, and End keyboard controls', () => {
    const player = fixture.nativeElement.querySelector('.player') as HTMLElement;
    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 2 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 1 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pause');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 6 of 6');

    player.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
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
    expect(fixture.nativeElement.textContent).not.toContain('Alt stack');
    expect(fixture.nativeElement.textContent).toContain('Now running STACK VALIDATION');
    expect(fixture.nativeElement.textContent).not.toContain('Consumed');
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
    control('Previous step').click();
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
    expect(dialog.textContent).toContain('OP_CODE');
    expect(dialog.textContent).toContain('Copy the top stack item');
    expect(dialog.textContent).toContain('Stack effect');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 4');
    expect(fixture.nativeElement.textContent).toContain('Empty stack');
  });

  it('explains each push as an opcode without advancing', () => {
    const pushOpcode = [...fixture.nativeElement.querySelectorAll('.operation-list button')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('OP_1'),
    ) as HTMLButtonElement;
    pushOpcode.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('OP_CODE');
    expect(dialog.textContent).toContain('OP_1');
    expect(dialog.textContent).toContain('0x51');
    expect(dialog.textContent).toContain('Purpose');
    expect(dialog.textContent).toContain('Push the Script number 1 onto the main stack.');
    expect(dialog.textContent).toContain('Stack effect');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 6');
  });

  it('explains pushed signature data without advancing', () => {
    fixture.componentRef.setInput('trace', {
      ...TRACE_FIXTURE,
      steps: TRACE_FIXTURE.steps.map((step, index) =>
        index === 0
          ? {
              ...step,
              opcode: {
                ...step.opcode,
                is_push: true,
                push_data: '0123456789abcdef',
              },
            }
          : step,
      ),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('0123…cdef');
    const signatureData = fixture.nativeElement.querySelector(
      '[aria-label="DATA (Signature), 8 bytes"]',
    ) as HTMLButtonElement;
    signatureData.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('DATA');
    expect(dialog.textContent).toContain('DATA (Signature)');
    expect(dialog.textContent).toContain('0123456789abcdef');
    expect(dialog.textContent).toContain('DER-encoded ECDSA signature');
    expect(dialog.textContent).toContain('places this signature onto the empty stack');
    expect(fixture.nativeElement.textContent).toContain('Step 0 of 5');
  });

  it('opens a concise data detail for a stack item', () => {
    control('Next step').click();
    control('Next step').click();
    fixture.detectChanges();

    const stackItem = fixture.nativeElement.querySelector(
      '[aria-label="DATA (True), 1 of stack"]',
    ) as HTMLButtonElement;
    stackItem.click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('STACK ITEM');
    expect(dialog.textContent).toContain('DATA (True)');
    expect(dialog.textContent).toContain('Stack position');
    expect(dialog.textContent).toContain('1');
    expect(dialog.textContent).toContain('Hex');
    expect(dialog.textContent).toContain('01');
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

    expect(fixture.nativeElement.textContent).toContain('Ready');
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
